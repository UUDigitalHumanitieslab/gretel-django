#!/usr/bin/env python3
"""
Simple script to compare performance of different search strategies on
individual BaseX databases. As an argument, pass the name of a plain
text file consisting of the XPaths to search for divided by newlines,
followed by a blank line, and the BaseX databases to search in divided
by newlines.
"""

from database_searcher import DatabaseSearcher

from timeit import default_timer as timer
from BaseXClient import BaseXClient

import argparse
import logging
import csv

session = BaseXClient.Session(
    'localhost', 1984, 'admin', 'admin'
)

PAGING_BY = 50

parser = argparse.ArgumentParser()
parser.add_argument('specification')
parser.add_argument('--output', default='results.csv',
                    help='output csv file')
parser.add_argument('--paging', default=None,
                    type=int)
args = parser.parse_args()
logging.basicConfig(level=logging.INFO)

f = open(args.specification, 'r')
xpaths = []
for line in f:
    if line.strip() == '':
        break
    xpaths.append(line.strip())
dbs = []
for line in f:
    if line.strip() != '':
        dbs.append(line.strip())

of = open(args.output, 'w')
of_writer = csv.writer(of)
columns = ['XPATH', 'Database', 'Database size (MiB)', 'Number of results',
           'Duration (count)', 'Duration (search)']
if args.paging:
    columns.extend(['Duration (search with paging)', 'Pages'])
of_writer.writerow(columns)

n_results_dict = {}
duration_nopaging_dict = {}
duration_paging_dict = {}
xpath_nr = 0
for xpath in xpaths:
    for db in dbs:
        logging.info(
            'Searching database {}, XPATH number {}.'
            .format(db, xpath_nr + 1)
        )
        # Get database size
        size_str = session.query(
            'string(db:info("{}")/databaseproperties/size)'
            .format(db)
        ).execute()
        if size_str[-3:] == ' MB':
            db_size = int(size_str[:-3])
        elif size_str[-3:] == ' kB':
            db_size = round(int(size_str[:-3]) / 1024, 1)
        else:
            db_size = size_str
        # First a dummy search (first search is slower because of
        # caching)
        searcher = DatabaseSearcher(session, db, xpath)
        searcher.search()
        # Then count
        start_time = timer()
        n_results = searcher.count()
        duration_count = timer() - start_time
        logging.info(
            'Counting      : {} results in {} seconds'
            .format(n_results, duration_count)
        )
        # Then search without paging
        start_time = timer()
        result = searcher.search()
        # Check if the number of results is the same
        n_results_search = result.count('<match>')
        if n_results_search != n_results:
            logging.warning(
                'Searching gives a different number of results than '
                'counting ({} versus {}).'
                .format(n_results_search, n_results)
            )
        duration_nopaging = timer() - start_time
        logging.info(
            'Without paging: {} results in {} seconds'
            .format(n_results_search, duration_nopaging)
        )
        n_results_dict[(xpath, db)] = n_results
        # With paging (if activated)
        if args.paging:
            start_time = timer()
            start = 0
            n_pages = 0
            n_results = 0
            while True:
                end = start + args.paging
                searcher.start = start
                searcher.end = end
                searcher.update_xquery()
                result = searcher.search()
                if result.strip() == '':
                    break
                n_results += result.count('<match>')
                n_pages += 1
                start = end
            duration_paging = timer() - start_time
            logging.info(
                'With paging   : {} results in {} seconds ({} pages)'
                .format(n_results, duration_paging, n_pages)
            )
        csv_row = [xpath_nr + 1, db, db_size, n_results, duration_count,
                   duration_nopaging]
        if args.paging:
            csv_row.extend([duration_paging, n_pages])
        of_writer.writerow(csv_row)
    xpath_nr += 1
logging.info('Results written to {}.'.format(args.output))
