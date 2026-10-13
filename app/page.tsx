import { redirect } from "next/navigation";

// "/" has no content of its own: send everyone to /login (the proxy then
// forwards signed-in users on to /todo).
export default function Home() {
  redirect("/login");
}
