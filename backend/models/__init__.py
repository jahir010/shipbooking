from tortoise import fields
from tortoise.models import Model

class User(Model):
    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=255, unique=True)
    password = fields.CharField(max_length=255)
    first_name = fields.CharField(max_length=100)
    last_name = fields.CharField(max_length=100)
    role = fields.CharField(max_length=20)  # customer, shipowner, admin
    status = fields.CharField(max_length=20, default='active')  # active, suspended
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "users"

class Ship(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=255)
    operator = fields.CharField(max_length=255)
    owner = fields.ForeignKeyField('models.User', related_name='ships')
    commission_rate = fields.FloatField(default=0)
    image = fields.TextField()
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

class Payment(Model):
    id = fields.IntField(pk=True)
    booking = fields.ForeignKeyField('models.Booking', related_name='payments')
    amount = fields.FloatField()
    platform_commission_amount = fields.FloatField(default=0)
    shipowner_amount = fields.FloatField(default=0)
    method = fields.CharField(max_length=50, default='sslcommerz')
    status = fields.CharField(max_length=20, default='pending')
    transaction_id = fields.CharField(max_length=100, unique=True)
    session_key = fields.CharField(max_length=255, null=True)
    gateway_reference = fields.CharField(max_length=255, null=True)
    gateway_payload = fields.JSONField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "payments"

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


class CabinHold(Model):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField('models.User', related_name='cabin_holds')
    route = fields.ForeignKeyField('models.Route', related_name='cabin_holds')
    cabin = fields.ForeignKeyField('models.Cabin', related_name='holds')
    status = fields.CharField(max_length=20, default='active')  # active, released, expired, converted
    expires_at = fields.DatetimeField()
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "cabin_holds"


class Withdrawal(Model):
    id = fields.IntField(pk=True)
    shipowner = fields.ForeignKeyField('models.User', related_name='withdrawals')
    amount = fields.FloatField()
    status = fields.CharField(max_length=20, default='pending')  # pending, completed, rejected
    note = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    processed_at = fields.DatetimeField(null=True)

    class Meta:
        table = "withdrawals"

class Review(Model):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField('models.User', related_name='reviews')
    ship = fields.ForeignKeyField('models.Ship', related_name='reviews')
    rating = fields.IntField()
    comment = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "reviews"
