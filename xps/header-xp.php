<title>GrETEL 2.0 - XPath Search</title>

<?php
require("../config/config.php");

$navigation="navigation-xp.php"; // progress bar script

// stylesheets

echo '
<link rel="stylesheet"href="http://fonts.googleapis.com/css?family=Oswald:400,300,700|Carrois+Gothic">
<link rel="stylesheet" href="'.$home.'/style/css/gretel.css">
<link rel="stylesheet" href="'.$home.'/style/css/tooltip.css">
<link rel="shortcut icon" type="image/png" href="'.$home.'/img/gretel_logo_trans.png">

<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="'.$home.'/js/tooltip.js"></script>
<script src="'.$home.'/js/browserDetection.js"></script>
<script src="'.$home.'/js/TaalPortaal.js"></script>
';

include_once("$root/scripts/AnalyticsTracking.php");
?>
