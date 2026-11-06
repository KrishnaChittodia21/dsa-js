class Solution {
    public int totalFruit(int[] fruits) {
        Map<Integer, Integer> count = new HashMap<>(); // type -> how many of it are in the window
        int left = 0, best = 0;
        for (int right = 0; right < fruits.length; right++) {
            count.merge(fruits[right], 1, (a, b) -> a + b);
            while (count.size() > 2) {                    // third type → repair
                int t = fruits[left];
                if (count.merge(t, -1, (a, b) -> a + b) == 0) count.remove(t); // keep size = distinct types
                left++;
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
