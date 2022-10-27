
Setting up GrETEL
=================

This chapter explains how to setup GrETEL on a local or production server.
Setting up your local installation is useful if you want to work on
GrETEL development, but also if you want to work locally with GrETEL,
for example to work with your own datasets or for better performance.
The GrETEL backend can also help you to add your own treebanks to the
BaseX database system if you want to manually perform your own queries.

.. note::
   This chapter is not yet complete.


Required background services
----------------------------
For full functionality, GrETEL requires the following services:

* An relational database management system (RDMS) of your choice, such
  as **PostgreSQL** or **SQLite**.

  By default, GrETEL works with SQLite, which does not require any
  configuration. This is enough for home installations, but for production
  servers a more complete RDMS such as PostgreSQL or MySQL is recommended.

* The **BaseX** XML database management system.

  The contents of the treebanks are saved in and retrieved from BaseX.
  BaseX is usually available from your Linux distribution and the
  daemon can easily be started using the command ``basexserver -S``.
  BaseX saves its data by default in the ``BaseX`` directory in
  the user's home folder and no further configuration is needed if
  the BaseX settings are left unchanged. GrETEL can run without BaseX,
  but searching and creating treebanks will not be possible. If necessary,
  the BaseX connection settings can be changed in ``settings.py`` by
  adjusting the settings starting with ``BASEX_``.

* The **Alpino** parser.

  GrETEL uses Alpino to parse example sentences and to upload treebanks
  that still have to be parsed. Installing Alpino can be tricky, but
  its functionality is not needed for most functionality of GrETEL and
  may be omitted for home installations.
  Installation of Alpino on Windows is known to be problematic.

  GrETEL can work both with Alpino as a daemon and as a standalone
  programme. GrETEL will prefer the daemon if configuration for both
  are provided.
  To start Alpino as a service, use (adapt if necessary): ::
    /opt/Alpino/bin/Alpino -notk -veryfast user_max=600000 \
      server_kind=parse server_port=7001 assume_input_is_tokenized=on \
      debug=0 end_hook=xml -init_dict_p batch_command=alpino_server \
      2>/tmp/alpino_server.log &

  If the above-mentioned configuration is used, no futher configuration
  of GrETEL in ``settings.py`` is necessary, but if necessary the
  connection settings can be changed in ``settings.py`` by adjusting the
  settings ``ALPINO_HOST`` and ``ALPINO_PORT``.

  If you want to use Alpino as an executable, make sure to set the
  ``ALPINO_PATH`` setting in ``settings.py``.

* The **Redis** message broker with the **Celery** task queue.

  Redis is used in combination with Celery to perform search
  queries on the background. If Redis and Celery are not running, search
  queries are performed immediately, which causes long waiting times when
  searching large treebanks.

  Installation of Redis should be easy using the packages of your Linux
  distribution. Start using the ``redis-server`` command.

  Celery will be installed together with the Python dependencies using
  ``pip``. Start a Celery worker using the following command: ::
    celery -A gretel worker -B -l INFO

.. note::
   GrETEL cannot efficiently detect the absence of a Celery worker, so
   if you don't want to use Celery make sure that Redis is not running
   either.

Checking the sanity of your installation
----------------------------------------

Python version and dependencies
```````````````````````````````
To check if the version of Python and your dependencies are compatible
with GrETEL, the easiest is to run the backend unit tests using
``manage.py test``. If all tests run correctly, it is very likely that
everything is in order. If some tests are skipped, that means that
GrETEL cannot connect to one or more services (BaseX and Alpino).

Backend startup checks
``````````````````````
On startup, GrETEL will check if it can make connection to BaseX and
Alpino and will show a warning if either of them is not running. If
no warning is given, these services are apparently working correctly.
If the services are not running, GrETEL will raise errors if their
functions are needed (BaseX for searching and Alpino for parsing).

GrETEL cannot run without a connection to a relational database according
to the settings in ``setup.py`` (e.g., PostgreSQL or SQLite). You will
see an error message if no connection can be made.

Diverging Alpino versions
`````````````````````````
If your GrETEL installation contains treebanks that have been parsed
using a different Alpino version than the one you have installed on
your system, there is a possibility that this may cause unexpected search
results. This may happen if you include treebanks that have been
parsed by others than yourself.

To check if there are differences in the Alpino versions used in your
GrETEL installation, run the ``show_alpino_versions`` management command
(as an argument after ``manage.py``). This will show the active installed
Alpino version that GrETEL uses for parsing example sentences, and the
Alpino version that was used to create your installed treebanks.

.. note::
   This command assumes that only a single version of Alpino per treebank
   was used for parsing.



Adding treebanks
----------------

GrETEL includes several tools to create treebanks. These tools can be
called from the command line as a management command, to be invoked
using ``manage.py``.

Import existing BaseX databases
```````````````````````````````
Use the ``import-existing`` command to include treebanks in GrETEL for
which the BaseX databases are already available on your system. This
command can be used when upgrading from a previous version of GrETEL
(4 and lower), in which the BaseX databases have the same format, but
in which the structures of the treebanks are described in a different
way. This command may also be used after copying BaseX databases from
another system.

This command works with a JSON configuration file describing the
treebank that you want to import. Example configuration files for
the LASSY Klein and Corpus Gesproken Nederlands treebanks can be
found in the directory ``backend/upload/gretel4``. The command will
check if the BaseX databases are properly functioning and will count
the number of sentences and words. If an error occurs in the process,
nothing will be written to the relational database.

Keep in mind that after running this command the BaseX databases are
managed by GrETEL and that they will normally be deleted if you
delete the corresponing components from GrETEL. To avoid this,
make sure that the ``DELETE_COMPONENTS_FROM_BASEX`` settings in
``settings.py`` is set to ``False``.

Using the ``upload-lassy`` admin command
````````````````````````````````````````
The ``upload-lassy`` command was created specifically for adding the
treebanks of the LASSY Groot corpus. This script expects an input
directory with a ``COMPACT`` folder containing .dz files (compressed
combinations of LASSY XML files). If the treebank you want to add does
not have this structure, it is not suitable for use with this
admin command and you will need to use a different way to add it to
GrETEL.

Run this command by providing the directory of the treebank input files as
its argument (i.e. the directory containing a directory called
``COMPACT``). The .dz files may be located in subdirectories of
``COMPACT``. The files will be uploaded to BaseX and the treebank's
information will be added to GrETEL's relational database so that it can
be used in the web interface.

By default, the script creates one component for each ``.dz`` file.
However, large treebanks may consist of hundreds of ``.dz`` files and
selecting these individually generally makes no sense. Use the option
``--group-by`` to group multiple files into one component.
This option takes one argument and can be either:

* A number, where all files having in common the first n characters in the
  filename are grouped into one component. For example, the files
  ``wik00_part0001.data.dz`` and ``wik00_part0002.data.dz`` will be grouped
  into a component with the name ``wik00`` if ``--group-by=5`` is given,
  but ``wik01_part0001.data.dz`` will go into component ``wik01``.
* A character and a number next to each other, where all files having in
  common the beginning up to the nth occurance of the given character are
  grouped into one component. For example, if ``--group-by=_3`` is given,
  the files ``vetdocs_PDFs_EPAR_zubrin_022101nl1.data.dz`` and
  ``vetdocs_PDFs_EPAR_zubrin_022101nl2.data.dz`` will be grouped into the
  same component named ``vetdocs_PDFs_EPAR``, because up to the third
  occurance of the underscore the filenames are the same.

The command will always create a single BaseX database for one ``.dz``
file, but the end user will only be aware of the components.

Use ``--help`` to get information about other options.

You can cancel the process at any time by pressing Ctrl+C. All files that
have already been imported will be ready to use. However, the next time the
script runs it will restart from the beginning.

Make sure you have enough disk space: the BaseX databases are much larger
than the input files. For instance, the EUROPARL treebank is 2.1 GiB in
size, but its BaseX database takes 15.6 GiB of disk space. The script
continually uses around 2-3 GiB of system memory, although this may vary
according to the BaseX version.


