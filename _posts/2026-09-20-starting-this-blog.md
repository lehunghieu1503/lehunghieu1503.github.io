---
layout: post
title: Starting this blog
tags: [meta]
---

This site is a public notebook for systems and robotics software.

I will keep posts focused on mechanisms: how a control loop is scheduled, how a message bus fails, how an update is packaged so a machine can roll back, how to measure latency instead of guessing it.

No company recaps. If a post mentions a stack, it is because the stack is the subject, not the employer.

### How a new post gets here

1. Add a file under `_posts/` named `YYYY-MM-DD-slug.md`.
2. Put YAML front matter at the top:

    ```yaml
    ---
    layout: post
    title: Your title
    tags: [cpp, ros2]
    ---
    ```

3. Write Markdown. Push to `main`. GitHub Pages rebuilds the site.

That is the whole workflow.
