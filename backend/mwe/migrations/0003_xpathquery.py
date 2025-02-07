# Generated by Django 4.0.5 on 2022-07-07 14:44

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('mwe', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='XPathQuery',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('query', models.TextField()),
                ('description', models.CharField(max_length=200)),
                ('rank', models.PositiveSmallIntegerField()),
                ('canonical', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='mwe.canonicalform')),
            ],
        ),
    ]
