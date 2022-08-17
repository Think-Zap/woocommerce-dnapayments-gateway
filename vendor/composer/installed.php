<?php return array(
    'root' => array(
        'pretty_version' => '1.1.4',
        'version' => '1.1.4.0',
        'type' => 'wordpress-plugin',
        'install_path' => __DIR__ . '/../../',
        'aliases' => array(),
        'reference' => NULL,
        'name' => 'dna/woocommerce',
        'dev' => true,
    ),
    'versions' => array(
        'composer/installers' => array(
            'pretty_version' => 'v1.12.0',
            'version' => '1.12.0.0',
            'type' => 'composer-plugin',
            'install_path' => __DIR__ . '/./installers',
            'aliases' => array(),
            'reference' => 'd20a64ed3c94748397ff5973488761b22f6d3f19',
            'dev_requirement' => false,
        ),
        'dna/dnapayments-sdk-php' => array(
            'pretty_version' => '1.1.4',
            'version' => '1.1.4.0',
            'type' => 'library',
            'install_path' => __DIR__ . '/../dna/dnapayments-sdk-php',
            'aliases' => array(),
            'reference' => '6a72267a7cdcc5ea329b9bc78c64ba6dc70db1ae',
            'dev_requirement' => false,
        ),
        'dna/woocommerce' => array(
            'pretty_version' => '1.1.4',
            'version' => '1.1.4.0',
            'type' => 'wordpress-plugin',
            'install_path' => __DIR__ . '/../../',
            'aliases' => array(),
            'reference' => NULL,
            'dev_requirement' => false,
        ),
        'rmccue/requests' => array(
            'pretty_version' => 'v1.8.1',
            'version' => '1.8.1.0',
            'type' => 'library',
            'install_path' => __DIR__ . '/../rmccue/requests',
            'aliases' => array(),
            'reference' => '82e6936366eac3af4d836c18b9d8c31028fe4cd5',
            'dev_requirement' => false,
        ),
        'roundcube/plugin-installer' => array(
            'dev_requirement' => false,
            'replaced' => array(
                0 => '*',
            ),
        ),
        'shama/baton' => array(
            'dev_requirement' => false,
            'replaced' => array(
                0 => '*',
            ),
        ),
    ),
);
