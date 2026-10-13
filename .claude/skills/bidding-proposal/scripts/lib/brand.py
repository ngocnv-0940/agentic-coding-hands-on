"""Sun* brand constants shared by every drawing module.

Kept dependency-free (python-pptx only) so `extra_slide_layouts`, `abs_draw`,
`gantt_layout` and `org_chart_layout` can all import it without a cycle.
Values mirror generate-slide/assets/helpers.js.
"""
from pptx.dml.color import RGBColor

SUN_RED = RGBColor(0xFF, 0x22, 0x00)
SUN_DARK_RED = RGBColor(0xAD, 0x0C, 0x00)
SUN_GOLD = RGBColor(0xB6, 0x92, 0x56)
LIGHT_GREY = RGBColor(0xF7, 0xF7, 0xF7)
BORDER_GREY = RGBColor(0xDD, 0xDD, 0xDD)
TEXT_DARK = RGBColor(0x1A, 0x1A, 0x1A)
TEXT_GREY = RGBColor(0x66, 0x66, 0x66)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
FONT = 'Noto Sans JP'  # single font keeps CJK/Vietnamese safe

GEN_W, GEN_H = 13.333, 7.5  # generate-slide authoring canvas (inches)
EMU_IN = 914400
