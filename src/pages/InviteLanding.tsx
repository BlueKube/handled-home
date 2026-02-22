import { useParams, useNavigate } from "react-router-dom";
import { Shield, Camera, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import handledLogo from "@/assets/handled-home-logo.png";

export default function InviteLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
        <img src={handledLogo} alt="Handled Home" className="h-12 mx-auto" />

        <h1 className="text-2xl font-bold">Your pro is moving updates to Handled Home</h1>

        <div className="space-y-4">
          {[
            { icon: <Shield className="h-6 w-6 text-primary" />, text: "Welcome credit when you activate" },
            { icon: <Camera className="h-6 w-6 text-primary" />, text: "Proof photos after each visit" },
            { icon: <CheckCircle className="h-6 w-6 text-primary" />, text: "Manage your home services in one place" },
          ].map((item, i) => (
            <Card key={i}>
              <CardContent className="py-4 flex items-center gap-4">
                {item.icon}
                <p className="text-sm font-medium text-left">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => navigate(`/auth?ref=${code}`)}
        >
          Get Started
        </Button>

        <p className="text-xs text-muted-foreground">
          Free to join. No commitments.
        </p>
      </div>
    </div>
  );
}
