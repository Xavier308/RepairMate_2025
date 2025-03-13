# repairmate_backend/api/management/commands/machine_data/cobas_data.py
def get_cobas_data(category_id=3, manufacturer_id=3, department_id=4, machine_type_id=4):
    """
    Returns the complete data for the Cobas 6000 analyzer.
    """
    return {
        'machine': {
            'name': 'Cobas 6000',
            'model': '6000',
            'series': 'none',
            'description': 'The Cobas 6000 is a high-end chemistry analyzer that can perform immunoassay and photometric analyses for qualitative and quantitative determinations.',
            'category_id': 4,  # Clinical Laboratory
            'manufacturer_id': 3,  # Roche Diagnostics
            'department_id': 4,  # Chemistry
            'machine_type_id': 4,  # Clinical Analyzer
            'image_name': 'cobas6000.png',
            'manual_name': 'Manual_Cobas_6000.pdf',
            'is_template': True,
            'is_public': True
        },
        'issues': [
            {
                'title': 'Instrument Fails to Power Up',
                'description': 'The instrument does not turn on when the power switch on the left side of the rack sampler unit is activated.',
                'error_code': 'COBAS-001',
                'keywords': 'power, startup, circuit, breaker, switch',
                'image_name': 'example4.png',
                'solutions': [
                    {
                        'description': 'Power Source Check',
                        'guide': [
                            {'step_number': 1, 'description': 'Ensure the instrument is plugged into a power socket'},
                            {'step_number': 2, 'description': 'Verify the main circuit breaker is in the ON position'},
                            {'step_number': 3, 'description': 'Verify the power switches for modules c 501 and e 601 are on'},
                            {'step_number': 4, 'description': 'Request a facility electrician to check the instrument’s circuit breaker'},
                            {'step_number': 5, 'description': 'Ensure the control unit’s power cable is securely plugged in'}
                        ]
                    }
                ]
            },
            {
                'title': 'Touchscreen Malfunctioning (No Display)',
                'description': 'The touchscreen does not turn on or respond.',
                'error_code': 'COBAS-002',
                'keywords': 'touchscreen, display, power',
                'image_name': 'example4.png',
                'solutions': [
                    {
                        'description': 'Touchscreen Check',
                        'guide': [
                            {'step_number': 1, 'description': 'Verify that the touchscreen’s operation switch is on'},
                            {'step_number': 2, 'description': 'Ensure the cable between the touchscreen and the instrument is securely connected'},
                            {'step_number': 3, 'description': 'Power cycle the analyzer by turning off the circuit breaker and then turning it on'}
                        ]
                    }
                ]
            },
            {
                'title': 'Probes Do Not Descend to Liquid Surface',
                'description': 'Sample probes fail to descend properly to the liquid surface.',
                'error_code': 'COBAS-003',
                'keywords': 'probe, sample, liquid, surface',
                'image_name': 'example4.png',
                'solutions': [
                    {
                        'description': 'Bubble and Obstruction Check',
                        'guide': [
                            {'step_number': 1, 'description': 'If bubbles are present on the liquid surface, use an applicator stick to eliminate them'},
                            {'step_number': 2, 'description': 'Ensure there is no obstacle in the probe’s path'}
                        ]
                    }
                ]
            },
            {
                'title': 'Erratic ISE Results Due to Air in Sipper Syringe',
                'description': 'ISE results are unstable or show excessive air in the sipper syringe.',
                'error_code': 'COBAS-004',
                'keywords': 'ISE, air, syringe, results',
                'image_name': 'example4.png',
                'solutions': [
                    {
                        'description': 'Reagent and Leak Check',
                        'guide': [
                            {'step_number': 1, 'description': 'Ensure the reagent bottles contain enough liquid and the ISE reference reagent line is fully immersed'},
                            {'step_number': 2, 'description': 'Inspect tubing and connections for leaks and tighten any loose fittings'},
                            {'step_number': 3, 'description': 'Check measuring cartridges are correctly positioned'},
                            {'step_number': 4, 'description': 'Verify that the reference cartridge is properly placed and perform a reagent prime if needed'}
                        ]
                    }
                ]
            },
            {
                'title': 'High or Low ISE Internal Standard Values',
                'description': 'ISE internal standard values are abnormal, showing high or low readings.',
                'error_code': 'COBAS-005',
                'keywords': 'ISE, standard, values, high, low',
                'image_name': 'example4.png',
                'solutions': [
                    {
                        'description': 'EMF and Leak Check',
                        'guide': [
                            {'step_number': 1, 'description': 'Confirm EMF deviation is within ±2 mV from the mean value between Standard Low and High'},
                            {'step_number': 2, 'description': 'Ensure ISE reagents and calibrators are correctly positioned'},
                            {'step_number': 3, 'description': 'Inspect sipper syringe assembly for leaks'}
                        ]
                    }
                ]
            }
        ]
    }