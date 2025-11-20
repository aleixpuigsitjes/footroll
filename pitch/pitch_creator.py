import numpy as np
import cv2 as cv2
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Arc

# 1 yard = 0.9144 m
# 1 inch = 25.4 mm
# 0.5 inch = 12.7 mm

# Paper size 
W_2A0_MM = 1682
H_2A0_MM = 1189
W_A0_MM  = 1189
H_A0_MM  = 841
W_A1_MM  = 841
H_A1_MM  = 594

GENERATE_SMALL_FIELD = True   # minimum FIFA field length with recommended aspect ratio (fits in A1 @ 8 mm)
GENERATE_LARGE_FIELD = False  # recommended FIFA size (fits in A0 @ 8 mm)

GENERATE_IN_COLOR = True
GENERATE_GRASS = True
GENERATE_VALUES  = True  # shot difficulty helper values on the grid
GENERATE_HEATMAP = False  # heat map of the shot difficulty on the grid

# This is the total number of cells which must include +4 cells for the goals and margins
# cell = 12.7 mm -> 2A0 = 132 x 93 cells
# cell = 10 mm   ->  A0 = 118 x 84 cells
# cell = 8 mm    ->  A1 = 105 x 74 cells, A0 = 148 x 105 cells

MM_PER_CELL = 8
DPI = 800  # Dots per Inch: multiple of 2
IMAGE_WIDTH_MM  = W_A1_MM
IMAGE_HEIGHT_MM = H_A1_MM
GRASS_INTENSITY = 25 # [0, 127]
GRASS_SIZE = 10
FONT_SIZE = 2.5

# FIFA specification pitch size:
# length 100-130 yards (recommended 114)
# width 50-100 yards (recommended 74)
# Camp Nou = recommended
FIELD_WIDTH_CELLS_MAX  = 130  # maximum of the FIFA specification
FIELD_HEIGHT_CELLS_MAX = 100  # maximum of the FIFA specification
if GENERATE_SMALL_FIELD:
    FIELD_WIDTH_CELLS  = 100  # must be even
    FIELD_HEIGHT_CELLS = 64   # must be even
if GENERATE_LARGE_FIELD:
    FIELD_WIDTH_CELLS  = 114  # must be even
    FIELD_HEIGHT_CELLS = 74   # must be even

PIXELS_PER_MM = int(DPI * 1/25.4 + 0.5)
PIXELS_PER_CELL = MM_PER_CELL * PIXELS_PER_MM

IMAGE_WIDTH  = IMAGE_WIDTH_MM * PIXELS_PER_MM
IMAGE_HEIGHT = IMAGE_HEIGHT_MM * PIXELS_PER_MM
FIELD_WIDTH  = FIELD_WIDTH_CELLS * PIXELS_PER_CELL
FIELD_HEIGHT = FIELD_HEIGHT_CELLS * PIXELS_PER_CELL
OFFSET_X = (IMAGE_WIDTH - FIELD_WIDTH) // 2
OFFSET_Y = (IMAGE_HEIGHT - FIELD_HEIGHT) // 2

FIELD_LEFT_X = OFFSET_X
FIELD_CENTER_X = OFFSET_X + FIELD_WIDTH // 2
FIELD_RIGHT_X = OFFSET_X + FIELD_WIDTH

FIELD_TOP_Y = OFFSET_Y
FIELD_CENTER_Y  = OFFSET_Y + FIELD_HEIGHT // 2
FIELD_BOTTOM_Y = OFFSET_Y + FIELD_HEIGHT

GOAL_WIDTH_CELLS = 8
GOAL_DEPTH_CELLS = 2
GOAL_WIDTH = GOAL_WIDTH_CELLS * PIXELS_PER_CELL
GOAL_DEPTH = GOAL_DEPTH_CELLS * PIXELS_PER_CELL
GOAL_Y = FIELD_CENTER_Y
GOAL_LEFT_X = FIELD_LEFT_X - GOAL_DEPTH
GOAL_RIGHT_X = FIELD_RIGHT_X + GOAL_DEPTH

# Adjusted line thickness and dot size
GRID_LINE_THICKNESS = 0.2
FIELD_LINE_THICKNESS = 1.0
DOT_RADIUS = PIXELS_PER_CELL / 10

if GENERATE_IN_COLOR:
    FIELD_LINES_COLOR = "white"
else:
    FIELD_LINES_COLOR = "black"

# Create a blank image with a green background
img = np.zeros((IMAGE_HEIGHT, IMAGE_WIDTH, 3), dtype=np.uint8)
if GENERATE_IN_COLOR:
    img[:, :] = [0, 154, 23] #[87, 124, 59] #[34, 139, 34]  # RGB for green
    if GENERATE_GRASS:
        # Add background grain noise to simulate grass texture
        noise = np.random.randint(-GRASS_INTENSITY, GRASS_INTENSITY, 
                                (img.shape[0] // GRASS_SIZE, img.shape[1] // GRASS_SIZE), 
                                dtype=np.int8)
        noise = cv2.resize(noise, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_NEAREST)
        img[:, :, 0] = np.clip(img[:, :, 0] + noise, 0, 255)
        img[:, :, 1] = np.clip(img[:, :, 1] + noise, 0, 255)
        img[:, :, 2] = np.clip(img[:, :, 2] + noise, 0, 255)
else:
    img[:, :] = [255, 255, 255]

# Drawing the football pitch
fig, ax = plt.subplots(figsize=(15, 9.75))

ax.imshow(img)
ax.axis('off')

# Draw the grid on the image
for x in range(OFFSET_X, OFFSET_X + FIELD_WIDTH + 1, PIXELS_PER_CELL):
    ax.plot([x, x], [OFFSET_Y, OFFSET_Y + FIELD_HEIGHT], color='black', linewidth=GRID_LINE_THICKNESS)
for y in range(OFFSET_Y, OFFSET_Y + FIELD_HEIGHT + 1, PIXELS_PER_CELL):
    ax.plot([OFFSET_X, OFFSET_X + FIELD_WIDTH], [y, y], color='black', linewidth=GRID_LINE_THICKNESS)

# Draw a grid inside the left goal
for x in range(int(GOAL_LEFT_X), int(GOAL_LEFT_X + GOAL_DEPTH + 1), PIXELS_PER_CELL):
    ax.plot([x, x], [GOAL_Y - GOAL_WIDTH / 2, GOAL_Y + GOAL_WIDTH / 2], color='black', linewidth=GRID_LINE_THICKNESS)
for y in range(int(GOAL_Y - GOAL_WIDTH / 2), int(GOAL_Y + GOAL_WIDTH / 2 + 1), PIXELS_PER_CELL):
    ax.plot([GOAL_LEFT_X, GOAL_LEFT_X + GOAL_DEPTH], [y, y], color='black', linewidth=GRID_LINE_THICKNESS)

# Draw a grid inside the right goal
for x in range(int(GOAL_RIGHT_X), int(GOAL_RIGHT_X - GOAL_DEPTH - 1), -PIXELS_PER_CELL):
    ax.plot([x, x], [GOAL_Y - GOAL_WIDTH / 2, GOAL_Y + GOAL_WIDTH / 2], color='black', linewidth=GRID_LINE_THICKNESS)
for y in range(int(GOAL_Y - GOAL_WIDTH / 2), int(GOAL_Y + GOAL_WIDTH / 2 + 1), PIXELS_PER_CELL):
    ax.plot([GOAL_RIGHT_X, GOAL_RIGHT_X - GOAL_DEPTH], [y, y], color='black', linewidth=GRID_LINE_THICKNESS)

# Draw goal lines and side lines
ax.plot([FIELD_LEFT_X,  FIELD_LEFT_X ], [FIELD_TOP_Y,    FIELD_BOTTOM_Y], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3)
ax.plot([FIELD_RIGHT_X, FIELD_RIGHT_X], [FIELD_TOP_Y,    FIELD_BOTTOM_Y], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3)
ax.plot([FIELD_LEFT_X,  FIELD_RIGHT_X], [FIELD_TOP_Y,    FIELD_TOP_Y   ], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3)
ax.plot([FIELD_LEFT_X,  FIELD_RIGHT_X], [FIELD_BOTTOM_Y, FIELD_BOTTOM_Y], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3)

# Midfield line, center point, and circle
ax.plot([FIELD_CENTER_X, FIELD_CENTER_X], [FIELD_TOP_Y, FIELD_BOTTOM_Y], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3)
ax.add_patch(Circle((FIELD_CENTER_X, (FIELD_TOP_Y + FIELD_BOTTOM_Y) // 2), DOT_RADIUS, color=FIELD_LINES_COLOR, zorder=3))
ax.add_patch(Circle((FIELD_CENTER_X, (FIELD_TOP_Y + FIELD_BOTTOM_Y) // 2), 10 * PIXELS_PER_CELL, color=FIELD_LINES_COLOR, fill=False, linewidth=FIELD_LINE_THICKNESS, zorder=3))

# Draw small goal area with correct orientation
SMALL_AREA_DEPTH = 6 * PIXELS_PER_CELL
SMALL_AREA_WIDTH = 20 * PIXELS_PER_CELL
SMALL_AREA_Y = FIELD_CENTER_Y - SMALL_AREA_WIDTH / 2
SMALL_AREA_LEFT_X = FIELD_LEFT_X
SMALL_AREA_RIGHT_X = FIELD_RIGHT_X - SMALL_AREA_DEPTH
SMALL_AREA_Y = FIELD_CENTER_Y - SMALL_AREA_WIDTH / 2
ax.add_patch(Rectangle((SMALL_AREA_LEFT_X, SMALL_AREA_Y), SMALL_AREA_DEPTH, SMALL_AREA_WIDTH, edgecolor=FIELD_LINES_COLOR, fill=False, linewidth=FIELD_LINE_THICKNESS, zorder=3))
ax.add_patch(Rectangle((SMALL_AREA_RIGHT_X, SMALL_AREA_Y), SMALL_AREA_DEPTH, SMALL_AREA_WIDTH, edgecolor=FIELD_LINES_COLOR, fill=False, linewidth=FIELD_LINE_THICKNESS, zorder=3))

# Draw big goal area with correct orientation
BIG_AREA_DEPTH = 18 * PIXELS_PER_CELL
BIG_AREA_WIDTH = 44 * PIXELS_PER_CELL
BIG_AREA_Y = FIELD_CENTER_Y - BIG_AREA_WIDTH / 2
BIG_AREA_LEFT_X = FIELD_LEFT_X
BIG_AREA_RIGHT_X = FIELD_RIGHT_X - BIG_AREA_DEPTH
ax.add_patch(Rectangle((BIG_AREA_LEFT_X, BIG_AREA_Y), BIG_AREA_DEPTH, BIG_AREA_WIDTH, edgecolor=FIELD_LINES_COLOR, fill=False, linewidth=FIELD_LINE_THICKNESS, zorder=3))
ax.add_patch(Rectangle((BIG_AREA_RIGHT_X, BIG_AREA_Y), BIG_AREA_DEPTH, BIG_AREA_WIDTH, edgecolor=FIELD_LINES_COLOR, fill=False, linewidth=FIELD_LINE_THICKNESS, zorder=3))

# Penalty points and circles
PENALTY_OFFSET_X= 12 * PIXELS_PER_CELL
PENALTY_Y = FIELD_CENTER_Y
PENALTY_LEFT_X = FIELD_LEFT_X + PENALTY_OFFSET_X
PENALTY_RIGHT_X = FIELD_RIGHT_X - PENALTY_OFFSET_X
ARC_DIAMETER = 20 * PIXELS_PER_CELL
ax.add_patch(Circle((PENALTY_LEFT_X, PENALTY_Y), DOT_RADIUS, color=FIELD_LINES_COLOR, zorder=3))
ax.add_patch(Circle((PENALTY_RIGHT_X, PENALTY_Y), DOT_RADIUS, color=FIELD_LINES_COLOR, zorder=3))
ax.add_patch(Arc((PENALTY_LEFT_X, PENALTY_Y), ARC_DIAMETER, ARC_DIAMETER, angle=0, theta1=307, theta2=53, color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3))
ax.add_patch(Arc((PENALTY_RIGHT_X, PENALTY_Y), ARC_DIAMETER, ARC_DIAMETER, angle=0, theta1=127, theta2=233, color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3))

# Left goal
ax.add_patch(Rectangle((GOAL_LEFT_X, GOAL_Y - GOAL_WIDTH / 2), GOAL_DEPTH, GOAL_WIDTH, edgecolor=FIELD_LINES_COLOR, fill=False, linewidth=FIELD_LINE_THICKNESS, zorder=3))
# Right goal
ax.add_patch(Rectangle((GOAL_RIGHT_X - GOAL_DEPTH, GOAL_Y - GOAL_WIDTH / 2), GOAL_DEPTH, GOAL_WIDTH, edgecolor=FIELD_LINES_COLOR, fill=False, linewidth=FIELD_LINE_THICKNESS, zorder=3))

# Clipped corner circles - using Arcs to represent the quarter circles
CORNER_CIRCLE_RADIUS = PIXELS_PER_CELL
ax.add_patch(Arc((FIELD_LEFT_X, FIELD_TOP_Y), 2*CORNER_CIRCLE_RADIUS, 2*CORNER_CIRCLE_RADIUS, angle=0, theta1=0, theta2=90, color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3))
ax.add_patch(Arc((FIELD_LEFT_X, FIELD_BOTTOM_Y), 2*CORNER_CIRCLE_RADIUS, 2*CORNER_CIRCLE_RADIUS, angle=0, theta1=270, theta2=360, color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3))
ax.add_patch(Arc((FIELD_RIGHT_X, FIELD_TOP_Y), 2*CORNER_CIRCLE_RADIUS, 2*CORNER_CIRCLE_RADIUS, angle=0, theta1=90, theta2=180, color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3))
ax.add_patch(Arc((FIELD_RIGHT_X, FIELD_BOTTOM_Y), 2*CORNER_CIRCLE_RADIUS, 2*CORNER_CIRCLE_RADIUS, angle=0, theta1=180, theta2=270, color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS, zorder=3))

# small lines near the corners

# Top left corner, horizontal line
start_x1 = FIELD_LEFT_X - PIXELS_PER_CELL
end_x1 = start_x1 + PIXELS_PER_CELL
y1 = FIELD_TOP_Y + 10 * PIXELS_PER_CELL

# Top left corner, vertical line
x2 = FIELD_LEFT_X + 10 * PIXELS_PER_CELL
start_y2 = FIELD_TOP_Y - PIXELS_PER_CELL
end_y2 = start_y2 + PIXELS_PER_CELL

# Top right corner, horizontal line
start_x3 = FIELD_RIGHT_X
end_x3 = start_x3 + PIXELS_PER_CELL
y3 = FIELD_TOP_Y + 10 * PIXELS_PER_CELL

# Top right corner, vertical line
x4 = FIELD_RIGHT_X - 10 * PIXELS_PER_CELL
start_y4 = FIELD_TOP_Y - PIXELS_PER_CELL
end_y4 = start_y4 + PIXELS_PER_CELL

# Bottom left corner, horizontal line
start_x5 = FIELD_LEFT_X - PIXELS_PER_CELL
end_x5 = start_x5 + PIXELS_PER_CELL
y5 = FIELD_BOTTOM_Y - 10 * PIXELS_PER_CELL

# Bottom left corner, vertical line
x6 = FIELD_LEFT_X + 10 * PIXELS_PER_CELL
start_y6 = FIELD_BOTTOM_Y
end_y6 = start_y6 + PIXELS_PER_CELL

# Bottom right corner, horizontal line
start_x7 = FIELD_RIGHT_X
end_x7 = start_x7 + PIXELS_PER_CELL
y7 = FIELD_BOTTOM_Y - 10 * PIXELS_PER_CELL

# Bottom right corner, vertical line
x8 = FIELD_RIGHT_X - 10 * PIXELS_PER_CELL
start_y8 = FIELD_BOTTOM_Y
end_y8 = start_y8 + PIXELS_PER_CELL

# Add the lines to the existing plot
ax.plot([start_x1, end_x1], [y1, y1], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS)
ax.plot([x2, x2], [start_y2, end_y2], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS)
ax.plot([start_x3, end_x3], [y3, y3], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS)
ax.plot([x4, x4], [start_y4, end_y4], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS)
ax.plot([start_x5, end_x5], [y5, y5], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS)
ax.plot([x6, x6], [start_y6, end_y6], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS)
ax.plot([start_x7, end_x7], [y7, y7], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS)
ax.plot([x8, x8], [start_y8, end_y8], color=FIELD_LINES_COLOR, linewidth=FIELD_LINE_THICKNESS)

# half_FIELD_WIDTH_CELLS = FIELD_WIDTH // (2 * PIXELS_PER_CELL)  # Half the width of the field in yards

# Compute goal lines helper values
# for y in range(OFFSET_Y + (PIXELS_PER_CELL // 2), IMAGE_HEIGHT - OFFSET_Y, PIXELS_PER_CELL):
#     distance_from_midfield = int(abs(y - IMAGE_HEIGHT/2) // PIXELS_PER_CELL) - 3
#     if distance_from_midfield >= 1:
#         ax.text(OFFSET_X - PIXELS_PER_CELL/2, y, str(distance_from_midfield), color='black', fontsize=4, ha='center', va='center', rotation=90)
#         ax.text(IMAGE_WIDTH - OFFSET_X + PIXELS_PER_CELL/2, y, str(distance_from_midfield), color='black', fontsize=4, ha='center', va='center', rotation=-90)
#     else:
#         ax.text(OFFSET_X - 2*PIXELS_PER_CELL - PIXELS_PER_CELL/2, y, str(0), color='black', fontsize=4, ha='center', va='center', rotation=90)
#         ax.text(IMAGE_WIDTH - OFFSET_X + 2*PIXELS_PER_CELL + PIXELS_PER_CELL/2, y, str(0), color='black', fontsize=4, ha='center', va='center', rotation=-90)
    
# Compute side lines helper values
# for x in range(OFFSET_X + (PIXELS_PER_CELL // 2), IMAGE_WIDTH - OFFSET_X, PIXELS_PER_CELL):
#     distance_from_midfield = abs(x - IMAGE_WIDTH/2) // PIXELS_PER_CELL
#     distance_to_nearest_sideline = int(half_FIELD_WIDTH_CELLS - distance_from_midfield)
#     if x < IMAGE_WIDTH/2:
#         rotation = 90
#     else:
#         rotation = -90
#     ax.text(x, OFFSET_Y - PIXELS_PER_CELL/2, str(distance_to_nearest_sideline), color='black', fontsize=4, ha='center', va='center', rotation=rotation)
#     ax.text(x, IMAGE_HEIGHT - OFFSET_Y + PIXELS_PER_CELL/2, str(distance_to_nearest_sideline), color='black', fontsize=4, ha='center', va='center', rotation=rotation)

# Iterate over the cells in the football pitch to compute and display the difficulty
for x in range(0, FIELD_WIDTH_CELLS):
    for y in range(0, FIELD_HEIGHT_CELLS):

        # closest distance is 0
        # dy = max(FIELD_HEIGHT_CELLS / 2.0 - y + 1, y - FIELD_HEIGHT_CELLS / 2.0) # make it symmetric around center axis
        # dx = min(x, FIELD_WIDTH_CELLS - x + 1)  # left or right goal (the closest)

        # closest distance is 1
        dy = max(FIELD_HEIGHT_CELLS / 2.0 - y, y - FIELD_HEIGHT_CELLS / 2.0 + 1) # make it symmetric around center axis
        dx = min(x + 1, FIELD_WIDTH_CELLS - x)  # left or right goal (the closest)
        
        # Calculate distance
        distance = np.sqrt(dx**2 + dy**2)
        distance_norm = distance / np.sqrt((FIELD_WIDTH_CELLS_MAX/2)**2 + (FIELD_HEIGHT_CELLS_MAX/2)**2)  # do not change the normalization if using a smaller field

        # Calculate aperture
        if dx != 0:
            aperture = np.arctan((dy + GOAL_WIDTH_CELLS / 2) / dx) - \
                       np.arctan((dy - GOAL_WIDTH_CELLS / 2) / dx)
            aperture_norm = aperture / np.pi
        else:
            aperture = 0
            aperture_norm = aperture / np.pi
            
        difficulty = int(max(distance_norm, (1 - aperture_norm)**15) * 100) # the non-linearity value is experimental
        difficulty = min(max(difficulty, 1), 100)  # clip in the range [1, 100], 0 if a failure

        if GENERATE_HEATMAP:
            # paint a colormap with difficulty level
            x_px = x * PIXELS_PER_CELL + OFFSET_X
            y_px = y * PIXELS_PER_CELL + OFFSET_Y
            cell_color = plt.cm.viridis(difficulty/100)
            ax.add_patch(Rectangle((x_px, y_px), PIXELS_PER_CELL, PIXELS_PER_CELL, facecolor=cell_color, edgecolor=None))
        
        if GENERATE_VALUES:
            # Display the computed difficulty on the pitch
            x_px = x * PIXELS_PER_CELL + PIXELS_PER_CELL//2 + OFFSET_X
            y_px = y * PIXELS_PER_CELL + PIXELS_PER_CELL//2 + OFFSET_Y
            ax.text(x_px + PIXELS_PER_CELL//5, y_px + PIXELS_PER_CELL//3, str(difficulty), color='black', fontsize=FONT_SIZE, fontweight='normal', ha='center', va='center')
            ax.text(x_px - PIXELS_PER_CELL//5, y_px - PIXELS_PER_CELL//3, str(difficulty), color='black', fontsize=FONT_SIZE, fontweight='normal', ha='center', va='center', rotation=180)

# Save the generated football pitch as a PNG file
file_path = "./football_pitch.png"
fig.savefig(file_path, bbox_inches='tight', pad_inches=0, dpi=DPI)
file_path

# plt.show()