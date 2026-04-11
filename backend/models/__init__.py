from tortoise import fields
from tortoise.models import Model

class User(Model):
    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=255, unique=True)
    password = fields.CharField(max_length=255)
    first_name = fields.CharField(max_length=100)
    last_name = fields.CharField(max_length=100)
    role = fields.CharField(max_length=20)  # customer, shipowner, admin
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "users"

class Ship(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=255)
    operator = fields.CharField(max_length=255)
    owner = fields.ForeignKeyField('models.User', related_name='ships')
    image = fields.CharField(max_length=500)
    description = fields.TextField()
    rating = fields.FloatField()
    review_count = fields.IntField()
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "ships"

class Route(Model):
    id = fields.IntField(pk=True)
    ship = fields.ForeignKeyField('models.Ship', related_name='routes')
    departure_port = fields.CharField(max_length=255)
    destination_port = fields.CharField(max_length=255)
    departure_time = fields.CharField(max_length=10)
    arrival_time = fields.CharField(max_length=10)
    duration = fields.FloatField()
    date = fields.DateField()
    seats_available = fields.IntField()
    total_seats = fields.IntField()
    base_price = fields.FloatField()
    status = fields.CharField(max_length=20, default='active')
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "routes"

class Cabin(Model):
    id = fields.IntField(pk=True)
    ship = fields.ForeignKeyField('models.Ship', related_name='cabins')
    type = fields.CharField(max_length=50)  # single-riverside, etc.
    number = fields.CharField(max_length=10)
    capacity = fields.IntField()
    base_price = fields.FloatField()
    amenities = fields.JSONField()

    class Meta:
        table = "cabins"

class Booking(Model):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField('models.User', related_name='bookings')
    route = fields.ForeignKeyField('models.Route', related_name='bookings')
    total_price = fields.FloatField()
    status = fields.CharField(max_length=20, default='pending')
    passengers = fields.JSONField()
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "bookings"

class BookingItem(Model):
    id = fields.IntField(pk=True)
    booking = fields.ForeignKeyField('models.Booking', related_name='items')
    cabin = fields.ForeignKeyField('models.Cabin', related_name='bookings')
    cabin_type = fields.CharField(max_length=50)
    cabin_number = fields.CharField(max_length=10)
    quantity = fields.IntField()
    price_per_unit = fields.FloatField()

    class Meta:
        table = "booking_items"

class Review(Model):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField('models.User', related_name='reviews')
    ship = fields.ForeignKeyField('models.Ship', related_name='reviews')
    rating = fields.IntField()
    comment = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "reviews"