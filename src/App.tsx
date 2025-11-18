import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { useState } from "react";

export default function App() {
  const [dark, setDark] = useState(true);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground p-8">
        <Button onClick={() => setDark(!dark)}>
          Toggle {dark ? "Light" : "Dark"}
        </Button>

        <div className="mt-6">
          <Card className="max-w-md">
            <CardContent className="p-4 space-y-2">
              <h1 className="text-xl font-semibold">Seiyuu Radio Tracker</h1>
              <p className="text-sm text-muted-foreground">
                Your episodes, progress, & backlog in one place.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
