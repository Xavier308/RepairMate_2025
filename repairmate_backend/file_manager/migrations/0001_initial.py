# Generated by Django 5.1 on 2024-10-09 00:49

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ManagedFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='managed_files/')),
                ('file_type', models.CharField(choices=[('IMAGE', 'Image'), ('PDF', 'PDF')], max_length=10)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('associated_model', models.CharField(max_length=50)),
                ('associated_id', models.IntegerField()),
            ],
        ),
    ]
