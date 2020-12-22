# States in client/server in `grew_web` / `grew_back`

| State | Access | `rewriting` | `rules` | `init`| `final`| `before`| `after` | server `state` |
|:-----:|--------|:--------:|:--------:|:--------:|:--------:|:--------:|:--------:|:--------:|
| 0 | Init | **-** | **-** | **-** | **-** | **-** | **-** |  ∅ |
| 1 | `upload_corpus` | **-** | **-** | **-** | **-** | **-** | **-** | `corpus` |
| 2 | `select_graph` (auto if 1 graph) | **-** | **-** | **+** | **-** | **-** | **-** | `graph` |
| 2.5 |  GRS loaded + `rewrite` &rarr; ∅ | **-** | **-** | **+** | **-** | **-** | **-** | `normal_forms = []` |
| 3 | GRS loaded + `rewrite`   | **+** | **-** | **+** | **-** | **-** | **-** | `normal_forms` |
| 4 | `select_normal_form` (auto if 1 nf) | **+** | **-** | **+** | **+** | **-** | **-** | `normal_form` |
| 5 | `rules` | **+** | **+** | **+** | **+** | **-** | **-** | `history` |
| 6 | `select_rule` (auto if 1 rule) | **+** | **+** | **+** | **+** | **+** | **+** | `position` |
