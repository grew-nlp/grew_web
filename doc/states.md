# States in client/server in `grew_web` / `grew_back`

| GUI Level | Access | `rewriting` | `rules` | `init`| `final`| `before`| `after` | server `state` |
|:-----:|--------|:--------:|:--------:|:--------:|:--------:|:--------:|:--------:|:--------:|
| 0 | Init | **-** | **-** | **-** | **-** | **-** | **-** |  ∅ |
| 1 | `upload_corpus` | **-** | **-** | **-** | **-** | **-** | **-** | `corpus` |
| 2 | `select_graph` (auto if 1 graph) | **-** | **-** | **+** | **-** | **-** | **-** | `graph` |
| 3 |  GRS loaded + `rewrite` &rarr; ∅ | **-** | **-** | **+** | **-** | **-** | **-** | `normal_forms = []` |
| 4 | GRS loaded + `rewrite`   | **+** | **-** | **+** | **-** | **-** | **-** | `normal_forms` |
| 5 | `select_normal_form` when `nb_rules` = 0 (auto if 1 nf) | **+** | **-** | **+** | **=** init | **-** | **-** | :warning: not updated |
| 6 | `select_normal_form` when `nb_rules` > 0 (auto if 1 nf) | **+** | **-** | **+** | **+** | **-** | **-** | `normal_form` |
| 7 | `rules` | **+** | **+** | **+** | **+** | **-** | **-** | `history` |
| 8 | `select_rule` (auto if 1 rule) | **+** | **+** | **+** | **+** | **+** | **+** | `position` |
