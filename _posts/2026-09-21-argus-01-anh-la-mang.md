---
layout: post
title: "01 — Ảnh trong C++ là mảng byte"
description: "Vì sao stride, không phải width, quyết định địa chỉ pixel — và vì sao memcpy cả một GstMap là bug firmware chứ không phải model kém."
tags: [cpp, cv, argus]
series: camera-ai-cpp
series_title: "Camera AI bằng C++"
series_order: 1
---

Camera AI bắt đầu bằng một câu hỏi rất không-AI: byte nào là pixel `(x, y)`?

Nếu trả lời sai, mọi thứ phía sau — letterbox, detect, tracker, overlay — vẫn chạy, vẫn ra số,
và vẫn sai. Không crash. Đó là lý do bài đầu tiên không nói về mạng nơ-ron.

## Quyết định: `Frame` giữ con trỏ và stride, không giữ pixel

Một `struct Image { std::vector<uint8_t> rgb; int w, h; }` là cách nghĩ của SWE.
Nó ngầm giả định ba điều: ảnh là RGB, dữ liệu là liền mạch, và mỗi hàng dài đúng `w * 3`.

Camera thật không hứa điều nào. `GstMapInfo` cho bạn con trỏ và một `stride` —
số byte của **một hàng**, có thể lớn hơn `width` vì phần cứng căn hàng cho đẹp.

`src/core/frame.hpp` trong ARGUS-VAE giữ đúng những gì camera đưa:

```cpp
struct Frame {
  std::byte* nv12{nullptr};   // con trỏ tới pixel — KHÔNG sở hữu
  int w{0};
  int h{0};
  int stride{0};              // byte một hàng Y; >= w
  int uv_offset{0};           // nơi plane UV bắt đầu
  int uv_stride{0};           // byte một hàng UV; có thể khác stride
  std::uint64_t monotonic_ns{0};
  std::uint64_t pts_ns{0};
  int stream_id{0};
  std::uint64_t frame_id{0};
  int slot{-1};               // slot trong pool, để trả lại
  bool discont{false};
};
```

`Frame` là **value type nhỏ**: metadata + con trỏ + slot. Nó không sở hữu pixel.
Chủ sở hữu là `BufferPool`; `Frame` chỉ là cái vé để đọc trong lúc còn pin.
Đó là lý do `Frame` copy được trong vài chục ns, còn pixel thì không bao giờ copy trên hot path.

## width, height, stride: ba số, không phải hai

Địa chỉ pixel là bài toán số học của **một** dòng:

```
địa chỉ(x, y) = base + y * stride + x * bytes_per_pixel
```

`height` không xuất hiện. `stride` mới xuất hiện — vì hàng `y` nằm ở `y * stride`,
không phải `y * w * bpp`.

Hai hệ quả:

- **Packed**: `stride == w * bpp`. Ảnh là một khối liền mạch.
- **Padded**: `stride > w * bpp`. Cuối mỗi hàng có vài byte rác mà phần cứng nhét vào.
  Bạn được phép bỏ qua chúng, nhưng **không được** coi chúng là pixel.

Với NV12 thì phức tạp hơn một chút: plane `Y` là ảnh xám full resolution,
plane `UV` là nửa chiều cao và có `stride` **độc lập**. Vì vậy `Frame` mới có
`uv_offset` và `uv_stride` riêng. Đó là chủ đề bài 02; ở đây ta ở lại với BGR.

## Vì sao `memcpy(map.size)` sai

Đây là bug kinh điển khi mới cầm GStreamer. `GstMapInfo.size` là **tổng byte của buffer**,
tức xấp xỉ `stride * height` — bao gồm cả padding. Nếu bạn copy cả `size` vào một
slab được thiết kế như ảnh packed `w * h * bpp`, hai chuyện xảy ra:

1. Bạn ghi `stride - w * bpp` byte rác vào cuối mỗi hàng.
2. Người đọc sau bạn giả định packed, nên ngay hàng kế tiếp đã lệch đi đúng
   lượng padding đó — ảnh bị **shear** (nghiêng), không báo lỗi.

Sai stride là méo ảnh, không phải crash. Nên người ta chỉ phát hiện khi box vẽ ra
lệch khỏi người đi bộ, và đi đổ lỗi cho model.

## Code: 60 dòng, tự chạy được

Lưu thành `pixel.cpp`, build bằng `g++ -std=c++20 -Wall -Wextra pixel.cpp -o pixel && ./pixel`.

```cpp
#include <cassert>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <vector>

struct Image {
  std::vector<std::uint8_t> bytes;  // sở hữu pixel
  int w{0};
  int h{0};
  int stride{0};                    // byte một hàng; >= w*3 khi padded
};

std::uint8_t* pixel(Image& im, int x, int y) {
  return im.bytes.data()
       + static_cast<std::ptrdiff_t>(y) * im.stride
       + static_cast<std::ptrdiff_t>(x) * 3;
}

Image make_bgr(int w, int h, int pad_to = 0) {
  Image im;
  im.w = w;
  im.h = h;
  im.stride = (pad_to > 0) ? pad_to : w * 3;
  im.bytes.assign(static_cast<std::size_t>(im.stride) * static_cast<std::size_t>(h), 0);
  return im;
}

int main() {
  // 4x3 packed BGR: stride = 12
  Image packed = make_bgr(4, 3);
  std::uint8_t* p = pixel(packed, 2, 1);
  p[0] = 0x10;  // B
  p[1] = 0x20;  // G
  p[2] = 0x30;  // R

  const std::ptrdiff_t off = p - packed.bytes.data();
  std::printf("packed stride=%d  pixel(2,1) @ %td  B=%02x G=%02x R=%02x\n",
              packed.stride, off, p[0], p[1], p[2]);
  assert(off == 1 * 12 + 2 * 3);  // 18

  // cùng 4x3 nhưng stride = 16 (padded, ví dụ hàng căn 16 byte)
  Image padded = make_bgr(4, 3, 16);
  padded.bytes[1 * 16 + 2 * 3 + 0] = 0x10;
  const std::ptrdiff_t poff = pixel(padded, 2, 1) - padded.bytes.data();
  std::printf("padded stride=%d  pixel(2,1) @ %td\n", padded.stride, poff);
  assert(poff == 1 * 16 + 2 * 3);  // 22

  // 1080p packed: cùng công thức, chỉ đổi số
  Image hd = make_bgr(1920, 1080);
  const std::ptrdiff_t hoff = pixel(hd, 100, 200) - hd.bytes.data();
  std::printf("1920x1080 packed  pixel(100,200) @ %td  (stride=%d)\n", hoff, hd.stride);
  assert(hoff == 200 * 5760 + 100 * 3);

  return 0;
}
```

Output:

```
packed stride=12  pixel(2,1) @ 18  B=10 G=20 R=30
padded stride=16  pixel(2,1) @ 22
1920x1080 packed  pixel(100,200) @ 1152300  (stride=5760)
```

Chú ý pixel `(2,1)` nhảy từ byte 18 (packed) sang 22 (padded). Cùng tọa độ, cùng ảnh.
Chỉ `stride` đổi. `memcpy` mù stride sẽ lấy byte 18 và gọi nó là `(2,1)` — lệch 4 byte,
tức hơn một pixel.

## Neo vào ARGUS

**Owner:** `src/core/frame.hpp` — struct `Frame` ở trên, gồm cả `uv_offset` / `uv_stride`.

**Test neo:** `tests/core/test_frame_bus.cpp:33`, `TEST(FrameBus, PushNv12PacksPaddedStrides)`.
Test này đưa vào `push_nv12` một ảnh 4×4 với `y_stride = 8` (padded) và assert output:

```cpp
EXPECT_EQ(out->stride, 4);      // đã pack về width
EXPECT_EQ(out->uv_stride, 4);
EXPECT_EQ(out->uv_offset, 16);  // w*h = 4*4
```

Đây chính là giả định mà bài này cảnh báo: GST cho stride 8, engine **pack lại** về 4
trước khi bất kỳ ai đọc. Xem vòng `for (row...)` trong `src/core/frame_bus.cpp:103`
để thấy nó copy từng hàng `w` byte, bỏ qua padding.

Chạy:

```bash
ctest --test-dir build -R test_frame_bus --output-on-failure
```

**Track:** [02 — Ảnh là mảng](../../../Prj1/docs/track/02-anh-la-mang.md) — lab nội bộ, nơi chấm “xong”.

## Bài tập (45 phút)

1. Trên giấy, không code: frame NV12 **4×4**, `y_stride = 8`. Tính offset byte của pixel `(2,1)`
   trên plane `Y`. Viết công thức trước, thay số sau.
2. Thêm vào `pixel.cpp` một hàm in 3 byte `(B, G, R)` của pixel `(x, y)` nhận `Image` theo `const&`.
   Gọi nó cho ảnh packed 1920×1080 tại `(0,0)`, `(1919,0)`, `(0,1079)`. Assert offset từng cái.
3. Cố ý làm sai: cho `pixel()` dùng `y * im.w * 3` thay vì `y * im.stride`. Chạy lại.
   Ghi một câu: chương trình có báo lỗi không, và ảnh nào sai.

**Xong khi:** không cần nhìn header, bạn viết được `địa chỉ = base + y*stride + x*bpp`
và giải thích được vì sao `memcpy(map.size)` biến một ảnh 1080p thành ảnh nghiêng.
