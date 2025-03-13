def get_breville_data(category_id=0, manufacturer_id=0, department_id=3, machine_type_id=3):
    """
    Returns the complete data for the Breville BES870XL machine, including
    all its issues, solutions, and troubleshooting guides.
    """
    return {
        'machine': {
            'name': 'Breville BES870XL',
            'model': 'BES870XL',
            'series': 'none',
            'description': 'The Breville BES870XL Barista Express is a brushed stainless steel espresso machine with an integrated burr grinder, PID temperature control, and manual steam wand, delivering barista-quality espresso at home in under one minute.',
            'category_id': 3,  # Food
            'manufacturer_id': 0,  # Breville
            'department_id': 3,  # Kitchen
            'machine_type_id': 3,  # Espresso Machine
            'image_name': 'Breville_BES870.png',
            'manual_name': 'Manual_Breville_BES870.pdf',
            'is_template': True,
            'is_public': True
        },
        'issues': [
            {
                'title': 'Machine Does Not Heat Up',
                'description': 'STEAM/HOT WATER Light Flashes When Turned On',
                'error_code': 'BRV-001',
                'keywords': 'Heat up, Heat, light, flashes, hot water, water',
                'image_name': 'example1.png',
                'solutions': [
                    {
                        'description': 'Check Steam Dial Position',
                        'guide': [
                            {'step_number': 1, 'description': 'Turn the STEAM/HOT WATER dial to the STANDBY position'},
                            {'step_number': 2, 'description': 'Wait for the machine to commence the normal heat-up procedure'}
                        ]
                    }
                ]
            },
            {
                'title': 'Water Does Not Flow from Group Head',
                'description': 'No hot water flowing during operation',
                'error_code': 'BRV-002',
                'keywords': 'water, flow, group, head, hot water, blocked',
                'image_name': 'example1.png',
                'solutions': [
                    {
                        'description': 'Check Operating Temperature',
                        'guide': [
                            {'step_number': 1, 'description': 'Allow machine to reach operating temperature - POWER light should stop flashing'},
                            {'step_number': 2, 'description': 'Verify all control panel lights are illuminated when ready'}
                        ]
                    },
                    {
                        'description': 'Check Water Tank',
                        'guide': [
                            {'step_number': 1, 'description': 'Verify water tank is filled'},
                            {'step_number': 2, 'description': 'Ensure water tank is fully inserted and locked into place'}
                        ]
                    },
                    {
                        'description': 'Descale Machine',
                        'guide': [
                            {'step_number': 1, 'description': 'Refer to "Descaling" section on page 25 of the user manual.'}
                        ]
                    },
                    {
                        'description': 'Check Coffee Grounds',
                        'guide': [
                            {'step_number': 1, 'description': 'If coffee only drips from portafilter, refer to “Espresso only drips” section.'}
                        ]
                    }
                ]
            },
            {
                'title': 'Espresso Only Drips from Portafilter',
                'description': 'Espresso flow is very slow or only drips.',
                'error_code': 'BRV-003',
                'keywords': 'Espresso, drips, portafilter, coffee, grounds, grind, size',
                'image_name': 'example1.png',
                'solutions': [
                    {
                        'description': 'Adjust Grind Size',
                        'guide': [
                            {'step_number': 1, 'description': 'Use a slightly coarser grind. Refer to "Setting the Grind Size" on page 13.'}
                        ]
                    },
                    {
                        'description': 'Adjust Coffee Dose and Tamp',
                        'guide': [
                            {'step_number': 1, 'description': 'Reduce coffee dose. Trim using the Razor™ tool after tamping.'},
                            {'step_number': 2, 'description': 'Tamp with 30–40 lbs of pressure.'}
                        ]
                    },
                    {
                        'description': 'Check Water Tank',
                        'guide': [
                            {'step_number': 1, 'description': 'Fill the water tank and ensure it is fully locked into place.'}
                        ]
                    },
                    {
                        'description': 'Unblock Filter Basket',
                        'guide': [
                            {'step_number': 1, 'description': 'Use the cleaning tool to unblock filter basket holes.'},
                            {'step_number': 2, 'description': 'If still blocked, soak in a cleaning tablet solution for 20 minutes and rinse.'}
                        ]
                    }
                ]
            },
            {
                'title': 'No Steam',
                'description': 'Machine produces no steam.',
                'error_code': 'BRV-004',
                'keywords': 'steam, steam wand, wand, no steam',
                'image_name': 'example1.png',
                'solutions': [
                    {
                        'description': 'Check Operating Temperature',
                        'guide': [
                            {'step_number': 1, 'description': 'Allow machine to reach operating temperature. Wait until STEAM/HOT WATER light stops flashing.'}
                        ]
                    },
                    {
                        'description': 'Check Water Tank',
                        'guide': [
                            {'step_number': 1, 'description': 'Fill tank and ensure it is locked into place.'}
                        ]
                    },
                    {
                        'description': 'Descale Machine',
                        'guide': [
                            {'step_number': 1, 'description': 'Refer to "Descaling" on page 25 of the user manual.'}
                        ]
                    },
                    {
                        'description': 'Clear Blocked Steam Wand',
                        'guide': [
                            {'step_number': 1, 'description': 'Refer to "Cleaning the Steam Wand" on page 27.'}
                        ]
                    }
                ]
            },
            {
                'title': 'Coffee Not Hot Enough',
                'description': 'Brewed coffee temperature is lower than expected.',
                'error_code': 'BRV-005',
                'keywords': 'coffee, temperature, not hot, cups',
                'image_name': 'example1.png',
                'solutions': [
                    {
                        'description': 'Pre-heat Cups and Portafilter',
                        'guide': [
                            {'step_number': 1, 'description': 'Rinse cups under hot water and place them on the warming tray.'},
                            {'step_number': 2, 'description': 'Rinse portafilter under hot water and dry thoroughly.'}
                        ]
                    },
                    {
                        'description': 'Adjust Milk Temperature',
                        'guide': [
                            {'step_number': 1, 'description': 'Heat milk until the jug base is hot to touch.'}
                        ]
                    },
                    {
                        'description': 'Descale Machine',
                        'guide': [
                            {'step_number': 1, 'description': 'Refer to "Descaling" on page 25.'}
                        ]
                    },
                    {
                        'description': 'Adjust Water Temperature',
                        'guide': [
                            {'step_number': 1, 'description': 'Refer to "Advanced Temperature Mode" on page 18.'}
                        ]
                    }
                ]
            },
            {
                'title': 'No Crema on Espresso',
                'description': 'Espresso lacks crema.',
                'error_code': 'BRV-006',
                'keywords': 'espresso, crema, coffee, grounds, tamping',
                'image_name': 'example1.png',
                'solutions': [
                    {
                        'description': 'Adjust Tamping Pressure and Grind Size',
                        'guide': [
                            {'step_number': 1, 'description': 'Tamp with 30–40 lbs of pressure.'},
                            {'step_number': 2, 'description': 'Use a finer grind. Refer to "Setting the Grind Size" on page 13.'}
                        ]
                    },
                    {
                        'description': 'Use Fresh Coffee Beans',
                        'guide': [
                            {'step_number': 1, 'description': 'Use fresh coffee beans or pre-ground coffee within a week.'}
                        ]
                    },
                    {
                        'description': 'Clear Blocked Filter Basket',
                        'guide': [
                            {'step_number': 1, 'description': 'Unblock using the cleaning tool. Soak in a cleaning tablet solution if necessary.'}
                        ]
                    }
                ]
            }
        ]
    }
