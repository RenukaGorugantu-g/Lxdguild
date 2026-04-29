<?php
/**
 * Plugin Name: LXD Guild Certificate Sync
 * Description: Sync LearnDash certificate completions into Supabase for LXD Guild certificate validation.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

add_shortcode('certificate_id', 'lxdg_learndash_certificate_id_shortcode');

function lxdg_learndash_certificate_id_shortcode($atts) {
    $atts = shortcode_atts(array(
        'course_id' => 0,
    ), $atts);

    $user_id = get_current_user_id();
    if (!$user_id || !$atts['course_id']) {
        return '';
    }

    $completion_date = learndash_user_get_course_completed_date($user_id, $atts['course_id']);
    if (!$completion_date) {
        return '';
    }

    $month = date('m', $completion_date);
    $year = date('Y', $completion_date);

    return 'CLXD' . $year . $month . $user_id;
}

add_action('learndash_course_completed', 'lxdg_sync_certificate_to_supabase', 20, 1);

function lxdg_sync_certificate_to_supabase($data) {
    if (empty($data['user']) || empty($data['course'])) {
        return;
    }

    $user = $data['user'];
    $course = $data['course'];
    $course_id = is_object($course) ? (int) $course->ID : (int) $course;
    $user_id = (int) $user->ID;
    $completion_date = learndash_user_get_course_completed_date($user_id, $course_id);

    if (!$completion_date) {
        return;
    }

    $certificate_code = lxdg_generate_certificate_code($user_id, $completion_date);
    $payload = array(
        'certificate_code' => $certificate_code,
        'learndash_user_id' => $user_id,
        'learner_email' => $user->user_email,
        'learner_name' => $user->display_name,
        'course_id' => $course_id,
        'course_name' => get_the_title($course_id),
        'completion_date' => gmdate('c', $completion_date),
        'certificate_url' => lxdg_get_certificate_url($course_id, $user_id),
        'certificate_id_display' => '#' . $certificate_code,
    );

    lxdg_send_certificate_to_supabase($payload);
}

function lxdg_generate_certificate_code($user_id, $completion_date) {
    $month = date('m', $completion_date);
    $year = date('Y', $completion_date);
    return 'CLXD' . $year . $month . $user_id;
}

function lxdg_get_certificate_url($course_id, $user_id) {
    if (!function_exists('learndash_get_course_certificate_link')) {
        return '';
    }

    $url = learndash_get_course_certificate_link($course_id, $user_id);
    return is_string($url) ? $url : '';
}

function lxdg_send_certificate_to_supabase($payload) {
    $endpoint = defined('LXDG_SUPABASE_SYNC_ENDPOINT') ? LXDG_SUPABASE_SYNC_ENDPOINT : '';
    $secret = defined('LXDG_SUPABASE_SYNC_SECRET') ? LXDG_SUPABASE_SYNC_SECRET : '';

    if (!$endpoint || !$secret) {
        error_log('LXD Guild certificate sync is not configured.');
        return;
    }

    $response = wp_remote_post($endpoint, array(
        'timeout' => 20,
        'headers' => array(
            'Content-Type' => 'application/json',
            'x-lxd-sync-secret' => $secret,
        ),
        'body' => wp_json_encode($payload),
    ));

    if (is_wp_error($response)) {
        error_log('LXD Guild certificate sync failed: ' . $response->get_error_message());
        return;
    }

    $status_code = wp_remote_retrieve_response_code($response);
    if ($status_code < 200 || $status_code >= 300) {
        error_log('LXD Guild certificate sync returned HTTP ' . $status_code . ' with body: ' . wp_remote_retrieve_body($response));
    }
}
