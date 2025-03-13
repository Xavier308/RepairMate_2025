# repairmate_backend/api/management/commands/machine_data/bambu_data.py
def get_bambu_data(category_id=2, manufacturer_id=2, department_id=0, machine_type_id=1):
    """
    Returns the complete data for the Bambu Lab X1 3D printer.
    """
    return {
        'machine': {
            'name': 'Bambu Lab X1',
            'model': 'X1',
            'series': 'none',
            'description': 'The Bambu Lab X1 Series 3D Printer is a high-speed, CoreXY machine with AI-powered features like automated bed leveling, multi-color/material printing, and lidar-guided precision, making it ideal for advanced projects.',
            'category_id': 5,  # 3D Printer
            'manufacturer_id': 2,  # Bambu Lab
            'department_id': 0,  # Production
            'machine_type_id': 1,  # Precision Equipment
            'image_name': 'bambu_lab_x1.png',
            'manual_name': 'Manual_BAMBU_LAB_X1.pdf',
            'is_template': True,
            'is_public': True
        },
        'issues': [
            {
                'title': 'Video Recording Function Not Enabled',
                'description': 'Users are unable to record video of the printing process, which could be used for troubleshooting print issues.',
                'error_code': 'BAMBU-001',
                'keywords': 'video, recording, SD card, card, monitoring',
                'image_name': 'example3.png',
                'solutions': [
                    {
                        'description': 'Enable Video Recording Function',
                        'guide': [
                            {'step_number': 1, 'description': 'Insert SD card into the printer'},
                            {'step_number': 2, 'description': 'Navigate to Setting > General > Video and enable recording'}
                        ]
                    }
                ],
                'troubleshooting': [
                    'Ensure the SD card is FAT32 format, Class 10 or U1 (minimum 10MB/s write speed).',
                    'Format larger SD cards (above 2TB) in the printer using the format tool.',
                    'If the SD card storage exceeds 85%, new videos will overwrite the oldest files.'
                ]
            },
            {
                'title': 'Printer Fails to Connect via Bluetooth or Wi-Fi',
                'description': 'The printer is not connecting to the app or fails to show in the Wi-Fi list, causing connectivity issues.',
                'error_code': 'BAMBU-002',
                'keywords': 'Bluetooth, Wi-Fi, wifi, connectivity, connection',
                'image_name': 'example3.png',
                'solutions': [
                    {
                        'description': 'Bluetooth Pairing Failures',
                        'guide': [
                            {'step_number': 1, 'description': 'Ensure Bluetooth permissions are granted on mobile (iOS/Android).'},
                            {'step_number': 2, 'description': 'Clear paired device and reattempt binding.'},
                            {'step_number': 3, 'description': 'Restart both the phone and printer.'}
                        ]
                    },
                    {
                        'description': 'Wi-Fi Troubleshooting Steps',
                        'guide': [
                            {'step_number': 1, 'description': 'Verify SSID and password, and ensure 2.4GHz Wi-Fi connection.'},
                            {'step_number': 2, 'description': 'Bring printer closer to router or try connecting to a mobile hotspot.'},
                            {'step_number': 3, 'description': 'Check for IP conflicts, verify same LAN network, and disable isolation or firewall settings if needed.'}
                        ]
                    }
                ],
                'troubleshooting': [
                    'If the IP address shows 0.0.0.0, restart router or switch router channels.',
                    'Enable “UPnP” and “IPv4 Multicast Streams” for network compatibility.'
                ]
            },
            {
                'title': 'Heat Bed Not Heating',
                'description': 'The heat bed does not reach the set temperature or remains at 0, affecting print quality.',
                'error_code': 'BAMBU-003',
                'keywords': 'heat, bed, temperature, heating, issue',
                'image_name': 'example3.png',
                'solutions': [
                    {
                        'description': 'If Temperature Shows 0°C',
                        'guide': [
                            {'step_number': 1, 'description': 'Check the connection of the NTC thermistor to the heat bed and MC board.'},
                            {'step_number': 2, 'description': 'Inspect for loose or damaged connectors.'}
                        ]
                    },
                    {
                        'description': 'If Temperature Shows Above 0°C But Bed Still Cold',
                        'guide': [
                            {'step_number': 1, 'description': 'Measure the heat bed resistance; abnormal values indicate replacement is needed.'},
                            {'step_number': 2, 'description': 'Verify power and signal connections from the heat bed to AC power board and MC board.'}
                        ]
                    }
                ],
                'troubleshooting': [
                    'Use a multimeter to measure resistance across specific points and reconnect power to verify temperature readings.'
                ]
            },
            {
                'title': 'LED Light Failure',
                'description': 'The LED light is dim or fails to turn on, affecting visibility within the printer chamber.',
                'error_code': 'BAMBU-004',
                'keywords': 'LED, light, visibility',
                'image_name': 'example3.png',
                'solutions': [
                    {
                        'description': 'Check LED Components',
                        'guide': [
                            {'step_number': 1, 'description': 'Inspect the AP board for short circuits and replace any damaged resistors.'},
                            {'step_number': 2, 'description': 'Ensure continuity in the MC-AP cable connection; if disrupted, replace the cable.'}
                        ]
                    }
                ],
                'troubleshooting': [
                    'Test voltage on the AP board, if accessible, to confirm power flow.',
                    'If LED still fails, replace it with a verified functional light.'
                ]
            },
            {
                'title': 'Circuit Board Power Issues',
                'description': 'After powering on, the screen remains off or circuit indicator lights are abnormal, signaling a potential short circuit.',
                'error_code': 'BAMBU-005',
                'keywords': 'circuit, power supply, short, short circuit, board',
                'image_name': 'example3.png',
                'solutions': [
                    {
                        'description': '24V Power Supply Check',
                        'guide': [
                            {'step_number': 1, 'description': 'Ensure consistent green light on the power supply indicator. If flashing, disconnect components to isolate the faulty board or module.'}
                        ]
                    }
                ],
                'troubleshooting': [
                    'Detach MC-AP and MC-TH cables to separate MC board influence.',
                    'Identify the faulty board by sequentially reconnecting components until indicators show failure.'
                ]
            },
            {
                'title': 'Tool Head Failure on X/Y Axis and Temperature Issues',
                'description': 'The tool head does not move, or temperature displays zero due to communication failure.',
                'error_code': 'BAMBU-006',
                'keywords': 'tool head, head, axis, temperature, communication, failure',
                'image_name': 'example3.png',
                'solutions': [
                    {
                        'description': 'AP or MC Board Fault Check',
                        'guide': [
                            {'step_number': 1, 'description': 'Inspect for visible damage on the MC board; replace if components are faulty.'},
                            {'step_number': 2, 'description': 'Disconnect MC-AP cable, shake cable, and observe temperature changes on screen to confirm connectivity.'}
                        ]
                    }
                ],
                'troubleshooting': [
                    'Use multimeter to test connectivity across specific contacts; replace cables as needed.'
                ]
            }
        ]
    }