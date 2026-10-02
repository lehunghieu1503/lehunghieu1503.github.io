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
{% assign group_lang = group.items | map: "lang" | compact | first | default: site.lang %}
<section class="series-index">
  <div class="series-index__head">
    <h2 class="series-index__title" lang="{{ group_lang }}">{{ group_title }}</h2>
    <span class="series-index__count">{% assign n = entries | size %}{{ n }} {% if n == 1 %}part{% else %}parts{% endif %}</span>
  </div>
  <ol class="series__list" lang="{{ group_lang }}">
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
