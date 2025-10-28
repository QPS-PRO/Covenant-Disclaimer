"""
PDF Utilities for Arabic text support and font management
"""
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors
import arabic_reshaper
from bidi.algorithm import get_display
import os
from pathlib import Path


# Font registration flag to avoid re-registering fonts
_FONTS_REGISTERED = False
_FONT_NAME = 'Helvetica'  # Default fallback


def register_arabic_fonts():
    """
    Register Arabic-supporting fonts with ReportLab.
    Uses system fonts that support Arabic characters.
    """
    global _FONTS_REGISTERED, _FONT_NAME
    
    if _FONTS_REGISTERED:
        return
    
    # Try to find and register Arial or other Arabic-supporting fonts
    # Common font paths on different systems (prioritize Arial)
    font_configs = [
        # macOS - Arial variants (most formal, preferred)
        # Note: We need the bold variant for proper font family mapping
        {'path': '/System/Library/Fonts/Supplemental/Arial.ttf', 'name': 'Arial', 'bold': '/System/Library/Fonts/Supplemental/Arial Bold.ttf'},
        {'path': '/Library/Fonts/Arial.ttf', 'name': 'Arial', 'bold': None},
        {'path': '/System/Library/Fonts/Supplemental/Arial Unicode.ttf', 'name': 'ArialUnicode', 'bold': None},
        {'path': '/Library/Fonts/Arial Unicode.ttf', 'name': 'ArialUnicode', 'bold': None},
        # Windows - Arial variants
        {'path': 'C:\\Windows\\Fonts\\arial.ttf', 'name': 'Arial', 'bold': 'C:\\Windows\\Fonts\\arialbd.ttf'},
        {'path': 'C:\\Windows\\Fonts\\Arial.ttf', 'name': 'Arial', 'bold': 'C:\\Windows\\Fonts\\arialbd.ttf'},
        {'path': 'C:\\Windows\\Fonts\\arialuni.ttf', 'name': 'ArialUnicode', 'bold': None},
        # Linux - Arial if installed (via msttcorefonts), then fallbacks
        {'path': '/usr/share/fonts/truetype/msttcorefonts/Arial.ttf', 'name': 'Arial', 'bold': '/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf'},
        {'path': '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', 'name': 'LiberationSans', 'bold': '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'},
        {'path': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'name': 'DejaVuSans', 'bold': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'},
    ]
    
    # Try to register the first available font
    for config in font_configs:
        font_path = config['path']
        font_name = config['name']
        bold_path = config.get('bold')
        
        if os.path.exists(font_path):
            try:
                # Register the regular font
                pdfmetrics.registerFont(TTFont(font_name, font_path))
                
                # Try to register bold variant if available
                bold_name = f"{font_name}-Bold"
                if bold_path and os.path.exists(bold_path):
                    try:
                        pdfmetrics.registerFont(TTFont(bold_name, bold_path))
                    except Exception as e:
                        print(f"  - Could not register bold variant: {e}")
                        bold_name = font_name  # Use regular if bold fails
                else:
                    bold_name = font_name  # Use same font for bold if not available
                
                # Register font family mapping
                pdfmetrics.registerFontFamily(
                    font_name,
                    normal=font_name,
                    bold=bold_name,
                    italic=font_name,
                    boldItalic=bold_name
                )
                _FONTS_REGISTERED = True
                _FONT_NAME = font_name
                print(f"Successfully registered font '{font_name}' from: {font_path}")
                if bold_name != font_name:
                    print(f"  - Bold variant: '{bold_name}'")
                return
            except Exception as e:
                print(f"Failed to register font from {font_path}: {e}")
                continue
    
    # If no system font found, use Helvetica as fallback
    print("Warning: Could not find Arabic-supporting font. Using Helvetica as fallback.")
    print("Arabic text may not display correctly.")
    _FONTS_REGISTERED = True
    _FONT_NAME = 'Helvetica'


def process_arabic_text(text):
    """
    Process Arabic text for proper display in PDF.
    Reshapes and applies BiDi algorithm for correct RTL rendering.
    
    Args:
        text: The text to process (may contain Arabic, English, or both)
        
    Returns:
        Properly formatted text ready for PDF rendering
    """
    if not text or not isinstance(text, str):
        return text
    
    # Check if text contains Arabic characters
    has_arabic = any('\u0600' <= char <= '\u06FF' or '\u0750' <= char <= '\u077F' 
                     or '\u08A0' <= char <= '\u08FF' or '\uFB50' <= char <= '\uFDFF' 
                     or '\uFE70' <= char <= '\uFEFF' for char in text)
    
    if has_arabic:
        try:
            # Reshape Arabic text (connect letters properly)
            reshaped_text = arabic_reshaper.reshape(text)
            # Apply BiDi algorithm for correct RTL display
            bidi_text = get_display(reshaped_text)
            return bidi_text
        except Exception as e:
            print(f"Warning: Failed to process Arabic text: {e}")
            # Return original text if processing fails
            return text
    
    return text


def create_arabic_safe_paragraph_style(base_style_name, **kwargs):
    """
    Create a ParagraphStyle that supports Arabic text.
    
    Args:
        base_style_name: Name of the base style to inherit from
        **kwargs: Additional style properties to override
        
    Returns:
        ParagraphStyle configured for Arabic text
    """
    from reportlab.lib.styles import getSampleStyleSheet
    
    # Ensure Arabic fonts are registered
    register_arabic_fonts()
    
    styles = getSampleStyleSheet()
    base_style = styles.get(base_style_name, styles['Normal'])
    
    # Default Arabic style properties
    default_props = {
        'fontName': 'Arabic',
        'fontSize': kwargs.get('fontSize', base_style.fontSize),
        'alignment': kwargs.get('alignment', TA_RIGHT if kwargs.get('is_arabic', False) else TA_LEFT),
    }
    
    # Merge with provided kwargs
    style_props = {**default_props, **kwargs}
    
    # Create new style
    style = ParagraphStyle(
        name=kwargs.get('name', 'ArabicStyle'),
        parent=base_style,
        **{k: v for k, v in style_props.items() if k != 'is_arabic'}
    )
    
    return style


def get_table_font_name():
    """
    Get the appropriate font name for tables that may contain Arabic text.
    
    Returns:
        Font name string
    """
    register_arabic_fonts()
    return _FONT_NAME


def process_table_data(data):
    """
    Process table data to handle Arabic text in cells.
    
    Args:
        data: 2D list of table data
        
    Returns:
        Processed table data with Arabic text properly formatted
    """
    if not data:
        return data
    
    processed_data = []
    for row in data:
        processed_row = []
        for cell in row:
            if isinstance(cell, str):
                processed_row.append(process_arabic_text(cell))
            else:
                processed_row.append(cell)
        processed_data.append(processed_row)
    
    return processed_data

