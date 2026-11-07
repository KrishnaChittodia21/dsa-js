class Solution {
    public int[][] reconstructQueue(int[][] people) {
        // Tallest first; for equal heights, smaller k first.
        int[][] sorted = people.clone();
        Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? Integer.compare(b[0], a[0]) : Integer.compare(a[1], b[1]));
        List<int[]> queue = new ArrayList<>();
        for (int[] person : sorted) {
            queue.add(person[1], person); // everyone already placed is >= this height
        }
        return queue.toArray(new int[0][]);
    }
}
