<?php

namespace App\Services;

use Twilio\Rest\Client;
use Twilio\Exceptions\TwilioException;

class TwilioSmsService
{
    protected $client;
    protected $from;
    
    public function __construct()
    {
        $this->client = new Client(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );
        $this->from = config('services.twilio.from');
    }
    
    /**
     * Send SMS using Twilio
     *
     * @param string $to
     * @param string $message
     * @return array
     */
    public function send(string $to, string $message): array
    {
        try {
            $twilioMessage = $this->client->messages->create(
                $to,
                [
                    'body' => $message,
                    'from' => $this->from,
                ]
            );
            
            return [
                'success' => true,
                'message_id' => $twilioMessage->sid,
                'status' => $twilioMessage->status,
                'to' => $twilioMessage->to,
                'from' => $twilioMessage->from,
                'body' => $twilioMessage->body,
                'date_created' => $twilioMessage->dateCreated->format('Y-m-d H:i:s'),
                'response' => $twilioMessage->toArray()
            ];
            
        } catch (TwilioException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'status' => 500
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'status' => 500
            ];
        }
    }
    
    /**
     * Send SMS to multiple numbers
     *
     * @param array $numbers
     * @param string $message
     * @return array
     */
    public function sendMultiple(array $numbers, string $message): array
    {
        $results = [];
        
        foreach ($numbers as $number) {
            $results[$number] = $this->send($number, $message);
            
            // Small delay to avoid rate limiting
            usleep(100000); // 0.1 second
        }
        
        return $results;
    }
    
    /**
     * Get message status
     *
     * @param string $messageSid
     * @return array
     */
    public function getMessageStatus(string $messageSid): array
    {
        try {
            $message = $this->client->messages($messageSid)->fetch();
            
            return [
                'success' => true,
                'sid' => $message->sid,
                'status' => $message->status,
                'to' => $message->to,
                'from' => $message->from,
                'body' => $message->body,
                'date_created' => $message->dateCreated->format('Y-m-d H:i:s'),
                'date_updated' => $message->dateUpdated->format('Y-m-d H:i:s'),
                'date_sent' => $message->dateSent ? $message->dateSent->format('Y-m-d H:i:s') : null,
                'error_code' => $message->errorCode,
                'error_message' => $message->errorMessage
            ];
            
        } catch (TwilioException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'status' => 500
            ];
        }
    }
    
    /**
     * Quick static method for testing
     *
     * @param string $to
     * @param string $message
     * @return array
     */
    public static function quickSend(string $to, string $message): array
    {
        $instance = new self();
        return $instance->send($to, $message);
    }
}
