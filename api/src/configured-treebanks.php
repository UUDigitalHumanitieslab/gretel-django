<?php

function getConfiguredTreebanks()
{
    global $databaseGroups;
    $configured_treebanks = array();

    foreach ($databaseGroups as $corpus => $settings) {
        if ($corpus == 'api') {
            continue;
        }

        if (array_key_exists('components', $settings)) {
            $grinded = isGrinded($corpus);

            // probably default settings, this doesn't work anyway
            if (!$grinded && $settings['port'] == 0000) {
                continue;
            }
            $components = array();

            foreach ($settings['components'] as $component_name) {
                $component_description = array(
                        'database_id' => $grinded ? $component_name : strtoupper($corpus).'_ID_'.strtoupper($component_name),
                        'title' => $component_name,
                        'description' => '',
                        'sentences' => '?',
                        'words' => '?',
                    );

                if (array_key_exists('component_descriptions', $settings)) {
                    $component_descriptions = $settings['component_descriptions'];
                    if (array_key_exists($component_name, $component_descriptions)) {
                        $component_description = array_merge($component_description, $component_descriptions[$component_name]);
                    }
                }

                $components[$component_name] = $component_description;
            }

            $title = array_key_exists('fullName', $settings) ? $settings['fullName'] : $corpus;

            if (array_key_exists('production', $settings)) {
                $description = $settings['production'];
            } else {
                $description = '';
            }
            if (array_key_exists('language', $settings)) {
                $description .= ' '.$settings['language'];
            }
            if (array_key_exists('version', $settings)) {
                $description .= ' - version '.$settings['version'];
            }
            $metadata = array_key_exists('metadata', $settings) ? $settings['metadata'] : array();
            if (array_key_exists('multioption', $settings)) {
                $multioption = $settings['multioption'];
            } else {
                $multioption = false;
            }
            $corpus_definition = array(
                    'title' => $title,
                    'description' => $description,
                    'components' => $components,
                    'metadata' => $metadata,
                    'multioption' => $multioption,
                );

            if (array_key_exists('groups', $settings)) {
                $corpus_definition['groups'] = $settings['groups'];
            }

            if (array_key_exists('variants', $settings)) {
                $corpus_definition['variants'] = $settings['variants'];
            }

            $configured_treebanks[$corpus] = $corpus_definition;
        }
    }

    return $configured_treebanks;
}
