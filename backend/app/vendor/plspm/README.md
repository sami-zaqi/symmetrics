# plspm (vendored, GPL-3.0)

Source: https://github.com/googlecloudplatform/plspm-python (PyPI: `plspm` 0.5.7)
License: GNU General Public License v3.0 -- see `LICENSE` in this directory.

## Why this is vendored instead of a pip dependency

1. **Pandas 3.0 incompatibility.** The upstream package uses `df.loc[label,]`
   (a 1-tuple key) in `inner_model.py`, whose behavior changed in pandas 3.0
   and now raises `ValueError: zip() argument 2 is longer than argument 1`.
   Fixed here by dropping the trailing comma (`df.loc[label]`) -- see the
   comment at that line. This is the only functional change from upstream.
2. **Import paths rewritten.** All internal `plspm.xxx` absolute imports were
   rewritten to `app.vendor.plspm.xxx` so this vendored copy is fully
   self-contained and does not depend on (or conflict with) a pip-installed
   `plspm` package.

## License implications -- read before distributing Symmetrics

GPL-3.0 is copyleft. This module was deliberately chosen (over an MIT-licensed
but methodologically different alternative, or a from-scratch reimplementation)
for **local, non-distributed use only**, per an explicit decision made when
the SEM-PLS feature was built. If Symmetrics is ever packaged, sold, or
otherwise distributed/conveyed to third parties while this module is still
part of the shipped code, GPL-3.0's terms (e.g. making the combined work's
source available under a GPL-compatible license) likely apply to at least the
distributed portions. Revisit this decision -- replace with a from-scratch
PLS-SEM implementation or a permissively-licensed alternative -- before any
commercial distribution.
