<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class WC_DNA_Payments_Helpers {


    /**
	 * Safely gets a value from $_POST.
	 *
	 * If the expected data is a string also trims it.
	 *
	 * @since 5.5.0
	 *
	 * @param string $key posted data key
	 * @param int|float|array|bool|null|string $default default data type to return (default empty string)
	 * @return int|float|array|bool|null|string posted data value if key found, or default
	 */
	public static function get_posted_value( $key, $default = '' ) {

		$value = $default;

		if ( isset( $_POST[ $key ] ) ) {
			$value = is_string( $_POST[ $key ] ) ? trim( $_POST[ $key ] ) : $_POST[ $key ];
		}

		return $value;
	}
}