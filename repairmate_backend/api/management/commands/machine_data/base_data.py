# repairmate_backend/api/management/commands/machine_data/base_data.py
def get_base_data():
    """
    Returns the base data needed for all machines:
    manufacturers, categories, departments, and machine types.
    """
    manufacturers = [
        {'name': 'Breville'},
        {'name': 'ARS Recycling Systems'},                  
        {'name': 'Bambu Lab'},          
        {'name': 'Roche Diagnostics'},
        {'name': 'HAAS AUTOMATION'},         
        {'name': 'Siemens'},
        {'name': 'ABB'}   
    ]

    
    categories = [
        {'category_name': 'Hydraulic Press'},
        {'category_name': 'CNC Machine'},
        {'category_name': 'Industrial Oven'},
        {'category_name': 'Food'},
        {'category_name': 'Clinical Laboratory'},
        {'category_name': '3D Printer'},
        {'category_name': 'Abrasive Blasting'}
    ]
    
    departments = [
        {'name': 'Production'},
        {'name': 'Assembly'},
        {'name': 'Quality Control'},
        {'name': 'Kitchen'},
        {'name': 'Chemistry'},
        {'name': 'Hematology'},
        {'name': 'Recycling'}
    ]
    
    machine_types = [
        {'name': 'Heavy Machinery'},
        {'name': 'Precision Equipment'},
        {'name': 'Heat Treatment'},
        {'name': 'Espresso Machine'},
        {'name': 'Clinical Analyzer'},
        {'name': 'Surface Preparation'}
    ]
    
    return {
        'manufacturers': manufacturers,
        'categories': categories,
        'departments': departments,
        'machine_types': machine_types
    }