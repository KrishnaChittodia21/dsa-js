class Solution {
    public int[] asteroidCollision(int[] asteroids) {
        int[] st = new int[asteroids.length]; // array used as a stack
        int top = 0;
        for (int a : asteroids) {
            boolean alive = true;
            // Collision only when the top moves right and the new one moves left.
            while (alive && a < 0 && top > 0 && st[top - 1] > 0) {
                if (st[top - 1] < -a) {
                    top--;         // top explodes; a keeps flying
                } else if (st[top - 1] == -a) {
                    top--;         // both explode
                    alive = false;
                } else {
                    alive = false; // a explodes
                }
            }
            if (alive) st[top++] = a;
        }
        return Arrays.copyOf(st, top);
    }
}
