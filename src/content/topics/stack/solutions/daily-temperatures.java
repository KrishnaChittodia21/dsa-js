class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] answer = new int[n];
        Deque<Integer> waiting = new ArrayDeque<>();     // indices, temperatures non-increasing
        for (int i = 0; i < n; i++) {
            while (!waiting.isEmpty() && temperatures[waiting.peek()] < temperatures[i]) {
                int j = waiting.pop();
                answer[j] = i - j;                       // day i is j's first warmer day
            }
            waiting.push(i);
        }
        return answer;
    }
}
