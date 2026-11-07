class Solution {
    public String[] findRelativeRanks(int[] score) {
        int n = score.length;
        // indices, largest score first
        PriorityQueue<Integer> heap = new PriorityQueue<>((a, b) -> Integer.compare(score[b], score[a]));
        for (int i = 0; i < n; i++) heap.offer(i);
        String[] medals = {"Gold Medal", "Silver Medal", "Bronze Medal"};
        String[] answer = new String[n];
        int place = 1;
        while (!heap.isEmpty()) {
            int i = heap.poll();
            answer[i] = place <= 3 ? medals[place - 1] : String.valueOf(place);
            place++;
        }
        return answer;
    }
}
