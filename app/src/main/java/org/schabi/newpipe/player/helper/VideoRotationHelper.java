/*
 * SPDX-FileCopyrightText: 2026 YouTube Free contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
package org.schabi.newpipe.player.helper;

/** Stable orientation bands leave a dead zone around diagonal/flat device positions. */
public final class VideoRotationHelper {
    public static final int UNKNOWN = -1;
    public static final int PORTRAIT = 0;
    public static final int LANDSCAPE = 1;

    private VideoRotationHelper() {
    }

    public static int stableOrientation(final int degrees) {
        if (degrees < 0 || degrees >= 360) {
            return UNKNOWN;
        }
        if ((degrees >= 60 && degrees <= 120) || (degrees >= 240 && degrees <= 300)) {
            return LANDSCAPE;
        }
        if (degrees <= 30 || degrees >= 330 || (degrees >= 150 && degrees <= 210)) {
            return PORTRAIT;
        }
        return UNKNOWN;
    }
}
