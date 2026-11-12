/*
 * SPDX-FileCopyrightText: 2026 YouTube Free contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
package org.schabi.newpipe.player.helper;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class VideoRotationHelperTest {
    @Test
    public void detectsBothLandscapeDirections() {
        assertEquals(VideoRotationHelper.LANDSCAPE, VideoRotationHelper.stableOrientation(90));
        assertEquals(VideoRotationHelper.LANDSCAPE, VideoRotationHelper.stableOrientation(270));
    }

    @Test
    public void detectsPortraitInBothDirections() {
        assertEquals(VideoRotationHelper.PORTRAIT, VideoRotationHelper.stableOrientation(0));
        assertEquals(VideoRotationHelper.PORTRAIT, VideoRotationHelper.stableOrientation(180));
        assertEquals(VideoRotationHelper.PORTRAIT, VideoRotationHelper.stableOrientation(359));
    }

    @Test
    public void ignoresFlatUnknownAndDiagonalReadings() {
        for (final int degrees : new int[]{-1, 360, 45, 135, 225, 315}) {
            assertEquals(VideoRotationHelper.UNKNOWN,
                    VideoRotationHelper.stableOrientation(degrees));
        }
    }

    @Test
    public void toleratesMovementWithinEachStableBand() {
        for (final int degrees : new int[]{60, 75, 105, 120, 240, 300}) {
            assertEquals(VideoRotationHelper.LANDSCAPE,
                    VideoRotationHelper.stableOrientation(degrees));
        }
        for (final int degrees : new int[]{1, 30, 150, 210, 330}) {
            assertEquals(VideoRotationHelper.PORTRAIT,
                    VideoRotationHelper.stableOrientation(degrees));
        }
    }
}
