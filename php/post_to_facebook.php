<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pageAccessToken = 'EAANW1bYv1GQBOzEOGMikRtkmLz5IvYzeRsgDRPyntDz3C9zrDwXkLAlcbuM2dKmJNBYuq0LrwwtKrN9vtsEitQLbSiRDOZBjPyCE3mXJvWP4ZBoNMwZCZCCjrEH6V7gFAGimXHpNb8w33J4s77b8PwxZCVhemlpTHr7xR9vqkVAsGut6yR2WrsZCXhYDaebqC1EfuLSvw9hAWkghietyF57VCl8WZAu';
    $photoUrl = $_POST['photoUrl'];
    $name = $_POST['name'];
    $caption = $_POST['caption'];

    $message = $name . ': ' . $caption;

    $url = 'https://graph.facebook.com/v12.0/511771975349442/photos';
    $data = [
        'url' => $photoUrl,
        'caption' => $message,
        'access_token' => $pageAccessToken
    ];

    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($data),
        ],
    ];
    $context  = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    $response = json_decode($result, true);

    if (isset($response['error'])) {
        echo 'Error posting to Facebook: ' . $response['error']['message'];
    } else {
        echo 'Photo post was successful! Post ID: ' . $response['id'];
    }
}
?> 