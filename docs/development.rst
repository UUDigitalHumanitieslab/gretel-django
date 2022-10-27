
Developing GrETEL
=================

This chapter describes the internals of GrETEL.

.. note::
   This chapter is not yet complete.

Overview
--------
GrETEL exist of a backend, written in Python using the Django web
applications framework, [#]_ and a frontend, written in TypeScript using
the Angular framework. [#]_

The backend is responsible for the following tasks:

* Maintenance of a relational database containing the information about
  all treebanks and cached search results (using Django's object
  relational mapper (ORM) and an API to access this information
* Parsing Dutch sentences (using the Alpino parser)
*

The frontend provides a user interface to the tasks of the backend, but
also implements quite a lot of functionality:

* Visualizing parsed sentences (the *tree visualizer*)
* Choosing the relevant parts of a parsed example sentence (the *matrix*)
* Interactively editing XPaths (using the `LASSY XPath module`__)
* Analyzing results

__ https://github.com/UUDigitalHumanitieslab/lassy-xpath

Representation of treebanks
---------------------------
All structural information about the installed treebanks in GrETEL's
relational database (managed by the Django

.. [#] The backend was written in PHP until GrETEL 4.
.. [#] The separation of GrETEL in a frontend and a backend was an addition
       in GrETEL 4.
