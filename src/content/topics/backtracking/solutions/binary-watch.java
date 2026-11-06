class Solution {
    // indices 0..3 are hour LEDs, 4..9 are minute LEDs
    private static final int[] VALUES = {8, 4, 2, 1, 32, 16, 8, 4, 2, 1};

    public String[] readBinaryWatch(int turnedOn) {
        List<String> result = new ArrayList<>();
        backtrack(0, turnedOn, 0, 0, result);
        return result.toArray(new String[0]);
    }

    private void backtrack(int start, int remaining, int hour, int minute, List<String> result) {
        if (hour > 11 || minute > 59) return; // prune invalid times
        if (remaining == 0) {
            result.add(hour + ":" + (minute < 10 ? "0" : "") + minute);
            return;
        }
        for (int i = start; i < VALUES.length; i++) {
            if (i < 4) backtrack(i + 1, remaining - 1, hour + VALUES[i], minute, result);
            else backtrack(i + 1, remaining - 1, hour, minute + VALUES[i], result);
        }
    }
}
