# repairmate_backend/api/management/commands/machine_data/haas_data.py
def get_haas_data(category_id=4, manufacturer_id=4, department_id=0, machine_type_id=1):
    """
    Returns the complete data for the Haas VF-2 CNC machine.
    """
    return {
        'machine': {
            'name': 'Haas VF-2',
            'model': 'VF-2X',
            'series': 'none',
            'description': 'The Haas VF2 is a 40 Taper 3 axis CNC mill that includes high-power and direct-drive spindles. The Haas VF2 is the most popular model of the Haas VF series.',
            'category_id': 1,  # CNC Machine
            'manufacturer_id':4,  # HAAS AUTOMATION
            'department_id': 0,  # Production
            'machine_type_id': 1,  # Precision Equipment
            'image_name': 'Haas_VF2.jpg',
            'manual_name': 'Manual_Haas_VF2_CNC.pdf',
            'is_template': True,
            'is_public': True
        },
        'issues': [
            {
                'title': 'Machine Power Supply and Electrical Connection Problems',
                'description': 'Machine may not function properly due to improper grounding or unstable power supply, especially when using phase converters.',
                'error_code': 'HAAS-001',
                'keywords': 'power, electrical, grounding, voltage, phase, converter',
                'image_name': 'example2.png',
                'solutions': [
                    {
                        'description': 'Check Ground Connection',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Ensure that a separate earth ground wire of the same conductor size as the input power is connected to the chassis.'
                            },
                            {
                                'step_number': 2,
                                'description': 'Use main plant ground; avoid local cold water pipes or adjacent ground rods.'
                            }
                        ]
                    },
                    {
                        'description': 'Stabilize Line Voltage',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Confirm that line voltage does not fluctuate more than ±10%.'
                            },
                            {
                                'step_number': 2,
                                'description': 'Measure harmonic distortion; it should not exceed 10% of total RMS voltage.'
                            }
                        ]
                    }
                ]
            },
            {
                'title': 'Air Pressure Insufficiency During Tool Changes',
                'description': 'During operation, air pressure may drop significantly (by over 10 psi), leading to improper function during tool or pallet changes.',
                'error_code': 'HAAS-002',
                'keywords': 'air, pressure, tool, change, regulator, compressor',
                'image_name': 'example2.png',
                'solutions': [
                    {
                        'description': 'Verify Air Supply',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Check if air pressure is maintained at a minimum of 100 psi.'
                            },
                            {
                                'step_number': 2,
                                'description': 'If air drops significantly, verify supply at the main air regulator input and increase compressor capacity if needed.'
                            }
                        ]
                    }
                ]
            },
            {
                'title': 'Coolant Level Depletion',
                'description': 'Low coolant levels can result in inadequate cooling, especially with the Through-the-Spindle Coolant (TSC) system, leading to potential overheating and pump damage.',
                'error_code': 'HAAS-003',
                'keywords': 'coolant, TSC, overheating, pump',
                'image_name': 'example2.png',
                'solutions': [
                    {
                        'description': 'Check Coolant Tank Regularly',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Monitor and refill coolant after every shift during heavy operations.'
                            }
                        ]
                    },
                    {
                        'description': 'Clean Coolant Tank',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Monthly, empty and thoroughly clean the coolant tank to remove sediment and avoid pump clogs.'
                            }
                        ]
                    }
                ]
            },
            {
                'title': 'Lubrication System Maintenance',
                'description': 'Insufficient lubrication can cause machine damage or wear, especially if the lubrication oil level drops below the “low” line on the reservoir.',
                'error_code': 'HAAS-004',
                'keywords': 'lubrication, wear, oil, level',
                'image_name': 'example2.png',
                'solutions': [
                    {
                        'description': 'Check Oil Levels Daily',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Ensure the lubrication oil level is maintained between the “low” and “high” marks on the reservoir.'
                            }
                        ]
                    },
                    {
                        'description': 'Replace Oil Filter Annually',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Change the way lube oil filter every 2000 hours or once per year to prevent blockages and ensure proper lubrication flow.'
                            }
                        ]
                    }
                ]
            },
            {
                'title': 'Excessive Oil or Water in Air Supply',
                'description': 'Excess oil or water can lead to machine malfunctions.',
                'error_code': 'HAAS-005',
                'keywords': 'air, supply, oil, water, contamination',
                'image_name': 'example2.png',
                'solutions': [
                    {
                        'description': 'Check Air Supply Monthly',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Inspect the air filter/regulator and empty the auto-drain bowl before starting the machine.'
                            }
                        ]
                    }
                ]
            },
            {
                'title': 'Transmission Oil Check and Refill (Vertical Mill 40-Taper)',
                'description': 'Transmission oil may be low, affecting the spindle operation.',
                'error_code': 'HAAS-006',
                'keywords': 'transmission, oil, spindle, refill',
                'image_name': 'example2.png',
                'solutions': [
                    {
                        'description': 'Transmission Oil Fill Procedure',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Access the transmission oil fill cup, pour Mobil DTE 25 until overflow indicates full, and close.'
                            }
                        ]
                    },
                    {
                        'description': 'Annual Oil Replacement',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Remove the sheet metal from the spindle head, drain and refill with 1¼ liters of Mobil DTE 25 gear oil.'
                            }
                        ]
                    }
                ]
            },
            {
                'title': 'Scheduled Maintenance Alert',
                'description': '“Maintenance Due” alert appears on-screen, signaling the need for scheduled maintenance.',
                'error_code': 'HAAS-007',
                'keywords': 'maintenance, alert, timer, reset',
                'image_name': 'example2.png',
                'solutions': [
                    {
                        'description': 'Perform Required Maintenance',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'Follow the suggested maintenance tasks on the screen, adjusting time intervals as needed.'
                            }
                        ]
                    },
                    {
                        'description': 'Reset Maintenance Timer',
                        'guide': [
                            {
                                'step_number': 1,
                                'description': 'After completing maintenance, deactivate and reactivate the item on the “Scheduled Maintenance” screen to reset hours.'
                            }
                        ]
                    }
                ]
            }
        ]
    }