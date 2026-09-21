---
layout: page
title: Series
permalink: /series/
description: Multi-part series of technical notes. Each part is self-contained but builds on the one before it.
lead: Long-form series. Read in order, or jump to the part you need.
image: ""
---

{% assign groups = site.posts | group_by: "series" %}
{% for group in groups %}
{% if group.name and group.name != "" %}
{% assign entries = group.items | sort: "series_order" %}
{% assign group_title = group.items | map: "series_title" | compact | first | default: group.name %}
<section class="series-index">
  <div class="series-index__head">
    <h2 class="series-index__title">{{ group_title }}</h2>
    <span class="series-index__count">{{ entries | size }} parts</span>
  </div>
  <ol class="series__list">
    {% for entry in entries %}
    <li class="series__item">
      <span class="series__no">{{ entry.series_order | default: forloop.index }}</span>
      <a class="series__title" href="{{ entry.url | relative_url }}">{{ entry.title }}</a>
    </li>
    {% endfor %}
  </ol>
</section>
{% endif %}
{% endfor %}
