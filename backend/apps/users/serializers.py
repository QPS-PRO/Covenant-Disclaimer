from rest_framework import serializers
from django.contrib.auth import get_user_model
from dj_rest_auth.registration.serializers import RegisterSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.
    """

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name")
        read_only_fields = ("email",)


class CustomRegisterSerializer(RegisterSerializer):
    """
    Custom registration serializer to include first name and last name fields.
    """

    username = None
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data.update(
            {
                "first_name": self.validated_data.get("first_name", ""),
                "last_name": self.validated_data.get("last_name", ""),
            }
        )
        return data

    def save(self, request):
        user = super().save(request)
        user.first_name = self.cleaned_data.get("first_name")
        user.last_name = self.cleaned_data.get("last_name")
        user.save()
        return user