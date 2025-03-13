# repairmate_backend/api/management/commands/machine_data/ars_data.py
def get_ars_data(category_id=1, manufacturer_id=1, department_id=6, machine_type_id=5):
    """
    Returns the complete data for the ARS S6 blasting machine.
    """
    return {
        'machine': {
            'name': 'ARS S6',
            'model': 'S6',
            'series': 'none',
            'description': 'The ARS S6 is a high-capacity abrasive blasting and recycling machine, designed for large-scale surface preparation projects. It uses a multi-nozzle system to clean surfaces while efficiently recycling abrasive materials and controlling dust.',
            'category_id': 6,  # Abrasive Blasting
            'manufacturer_id': 1,  # ARS Recycling Systems
            'department_id': 6,  # Recycling
            'machine_type_id': 5,  # Surface Preparation
            'image_name': 'ARS_S6.jpg',
            'manual_name': 'Manual_ARS_Recycling_S6.pdf',
            'is_template': True,
            'is_public': True
        },
        'issues': [
            {
                'title': 'Motor Starter Shuts Off, No Breaker Triggered',
                'description': 'Low voltage due to a dirty fuel filter, which restricts fuel flow to the generator.',
                'error_code': 'ARS-001',
                'keywords': 'motor, starter, fuel filter, generator',
                'image_name': 'example5.png',
                'solutions': [
                    {
                        'description': 'Replace the Fuel Filter',
                        'guide': [
                            {'step_number': 1, 'description': 'Shut down the generator'},
                            {'step_number': 2, 'description': 'Locate and replace the fuel filter to ensure adequate fuel flow. Refer to section 8.06 in the manual.'}
                        ]
                    }
                ]
            },
            {
                'title': '#1 Bucket Elevator Will Not Start or Shuts Off When Bypass Start Switch Is Released',
                'description': 'One or more motors in the cleaning system are overloaded or have stopped.',
                'error_code': 'ARS-002',
                'keywords': 'bucket, elevator, motor, bypass, start, switch',
                'image_name': 'example5.png',
                'solutions': [
                    {
                        'description': 'Restart Sequence for #1 Bucket Elevator',
                        'guide': [
                            {'step_number': 1, 'description': 'Shut down the entire system.'},
                            {'step_number': 2, 'description': 'Restart the system, ensuring #1 Elevator is the last motor to start.'},
                            {'step_number': 3, 'description': 'Switch the bypass to start mode and hold it while pressing the start switch for #1 Elevator.'}
                        ]
                    }
                ]
            },
            {
                'title': '#1 or #2 Bucket Elevators Run Briefly, Then Shut Off',
                'description': 'The bucket elevator shuts off shortly after starting, caused by various sensor or belt issues.',
                'error_code': 'ARS-003',
                'keywords': 'bucket, elevator, sensor, belt, slipping, zero-speed, speed, sensor',
                'image_name': 'example5.png',
                'solutions': [
                    {
                        'description': 'Adjust Belt Tension and Tracking',
                        'guide': [
                            {'step_number': 1, 'description': 'Check belt tension and adjust if necessary.'},
                            {'step_number': 2, 'description': 'Ensure the belt is properly aligned to avoid slippage. Refer to section 8.02 for detailed instructions.'}
                        ]
                    },
                    {
                        'description': 'Clean Sensor Lens',
                        'guide': [
                            {'step_number': 1, 'description': 'Clean the sensor lens to remove any dirt or grease.'},
                            {'step_number': 2, 'description': 'Ensure it has a clear view of the rod.'}
                        ]
                    },
                    {
                        'description': 'Realign Sensor Above Rod',
                        'guide': [
                            {'step_number': 1, 'description': 'Adjust the sensor to be directly above the rod, within ¼” distance.'},
                            {'step_number': 2, 'description': 'Confirm sensor alignment by checking for a red flash each time the rod passes.'}
                        ]
                    },
                    {
                        'description': 'Check Sensor Light and Replace if Needed',
                        'guide': [
                            {'step_number': 1, 'description': 'Open the main control panel and locate breaker #13CB.'},
                            {'step_number': 2, 'description': 'Switch off the breaker and observe the diagnostic screen. If all motors start correctly without the diagnostic screen, replace the faulty sensor on the affected elevator. Refer to section 8.02 for replacement parts and further information.'}
                        ]
                    }
                ]
            },
            {
                'title': 'Elevators Trigger Breaker on Motor Starter',
                'description': 'Hardened grit obstructs the elevator belt, causing motor overheating and tripping the breaker.',
                'error_code': 'ARS-004',
                'keywords': 'elevator, breaker, motor, starter, grit, obstruction',
                'image_name': 'example5.png',
                'solutions': [
                    {
                        'description': 'Clear Obstructions from Elevator Belt',
                        'guide': [
                            {'step_number': 1, 'description': 'Open the elevator and inspect for any jammed grit or debris.'},
                            {'step_number': 2, 'description': 'Remove obstructions and check for bent or loosened buckets.'},
                            {'step_number': 3, 'description': 'If no obstructions are found, inspect for loose wires or connections in the main control panel.'},
                            {'step_number': 4, 'description': 'Establish a monthly maintenance program to inspect and secure screws and connections.'}
                        ]
                    }
                ]
            }
        ]
    }