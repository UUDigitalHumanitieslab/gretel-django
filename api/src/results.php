<?php

require_once ROOT_PATH.'/functions.php';

require_once ROOT_PATH.'/basex-search-scripts/basex-client.php';
require_once ROOT_PATH.'/basex-search-scripts/metadata.php';
require_once ROOT_PATH.'/basex-search-scripts/treebank-search.php';

$needRegularSonar = false;

function getResults($xpath, $context, $corpus, $components, $start, $searchLimit, $variables = null, $remainingDatabases = null)
{
    global $dbuser, $dbpwd, $needRegularSonar, $flushLimit;

    $already = array(); // TODO: unresolved Sonar behavior (see #81)

    // connect to BaseX
    if ($corpus == 'sonar') {
        $serverInfo = getServerInfo($corpus, $components[0]);
    } else {
        $serverInfo = getServerInfo($corpus, false);
    }

    $dbhost = $serverInfo['machine'];
    $dbport = $serverInfo['port'];
    $session = new Session($dbhost, $dbport, $dbuser, $dbpwd);

    if ($remainingDatabases != null) {
        $databases = $remainingDatabases;
    } elseif ($corpus == 'sonar') {
        $bf = xpathToBreadthFirst($xpath);
        // Get correct databases to start search with also sets
        // $needRegularSonar
        $databases = checkBfPattern($bf);
    } else {
        $databases = corpusToDatabase($components, $corpus);
    }

    $results = getSentences($corpus, $databases, $already, $start, $session, null, $searchLimit, $xpath, $context, $variables);
    if ($results[7] * $flushLimit >= $searchLimit) {
        // clear the remaining databases to signal the search is done
        $results[8] = array();
    }
    $session->close();

    return $results;
}
