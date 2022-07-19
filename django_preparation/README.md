### Preparatory code for switch to Django backend

The code in this directory is meant to explore how some important GrETEL
functionality can be rewritten in Python and to find the most efficient
solutions by benchmarking.

# database_searcher.py

A class to search in a single database (each treebank consists of one or
more components, which in turn consist of one or more databases -- the
user does not see the individual databases). The class may end up in the
Django application and will be used by higher-level code that searches
entire components.

# searcher_benchmark.py

This script was made to run the benchmarks of GitHub issue #3.

The BaseX server should run and to use this script you need to have the
BaseX databases prepared that you want to experiment with -- these can
be created using GrETEL-upload or using the script in
``/utils/lassy_to_basex.py``.

Usage: ``./searcher_benchmark.py [-h] [--output OUTPUT] [--paging PAGING] specification``

The specification is a file containing first the XPaths you want to search
with (each on one line), then a blank line, and then the BaseX databases
you want to search in. By default it outputs to results.csv.
