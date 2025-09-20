from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
import math

class CustomPageNumberPagination(PageNumberPagination):
    page_query_param = "page"
    page_size_query_param = "page_size"   
    max_page_size = 200                  
    page_size = 5                

    def get_paginated_response(self, data):
        page_size = self.get_page_size(self.request) or self.page_size
        total_pages = math.ceil(self.page.paginator.count / page_size) if page_size else 1

        return Response({
            "count": self.page.paginator.count,
            "total_pages": total_pages,
            "current_page": self.page.number,
            "results": data
        })
