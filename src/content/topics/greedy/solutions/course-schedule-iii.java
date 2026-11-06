class Solution {
    public int scheduleCourse(int[][] courses) {
        int[][] sorted = courses.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[1], b[1])); // earliest deadline first
        PriorityQueue<Integer> taken = new PriorityQueue<>(Collections.reverseOrder()); // durations of chosen courses
        int time = 0;
        for (int[] c : sorted) {
            int duration = c[0], lastDay = c[1];
            taken.add(duration);
            time += duration;
            if (time > lastDay) {
                time -= taken.poll(); // drop the longest course: same count, least time used
            }
        }
        return taken.size();
    }
}
