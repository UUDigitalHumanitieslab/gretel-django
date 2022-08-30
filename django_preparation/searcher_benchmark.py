#!/usr/bin/env python3
"""
Simple script to compare performance of different search strategies on
individual BaseX databases. As an argument, pass the name of a plain
text file consisting of the XPaths to search for divided by newlines,
followed by a blank line, and the BaseX databases to search in divided
by newlines.
"""

from basex_search import generate_xquery_search, generate_xquery_count

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
of_writer.writerow(columns)

n_results_dict = {}
duration_dict = {}
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
        search_xquery = generate_xquery_search(db, xpath)
        session.query(search_xquery).execute()
        # Then count
        start_time = timer()
        count_xquery = generate_xquery_count(db, xpath)
        n_results = int(session.query(count_xquery).execute())
        duration_count = timer() - start_time
        logging.info(
            'Counting      : {} results in {} seconds'
            .format(n_results, duration_count)
        )
        # Then search
        start_time = timer()
        result = session.query(search_xquery).execute()
        # Check if the number of results is the same
        n_results_search = result.count('<match>')
        if n_results_search != n_results:
            logging.warning(
                'Searching gives a different number of results than '
                'counting ({} versus {}).'
                .format(n_results_search, n_results)
            )
        duration = timer() - start_time
        logging.info(
            'Search: {} results in {} seconds'
            .format(n_results_search, duration)
        )
        n_results_dict[(xpath, db)] = n_results
        csv_row = [xpath_nr + 1, db, db_size, n_results, duration_count,
                   duration]
        of_writer.writerow(csv_row)
    xpath_nr += 1
logging.info('Results written to {}.'.format(args.output))
