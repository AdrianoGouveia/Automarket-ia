import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageText, setMessageText] = useState("");

  const { data: conversations, isLoading: conversationsLoading } = trpc.messagesRouter.getConversations.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: messages, refetch: refetchMessages } = trpc.messagesRouter.getMessages.useQuery(
    {
      carId: selectedConversation?.carId || 0,
      otherUserId: selectedConversation?.otherUserId || 0,
    },
    { enabled: !!selectedConversation }
  );

  const sendMessage = trpc.messagesRouter.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
    },
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    sendMessage.mutate({
      carId: selectedConversation.carId,
      receiverId: selectedConversation.otherUserId,
      content: messageText,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Mensagens</h1>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid md:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Conversas</h2>
            <ScrollArea className="h-full">
              {conversationsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : conversations && conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map((conv: any) => (
                    <button
                      key={conv.key}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${
                        selectedConversation?.key === conv.key ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">Usuário #{conv.otherUserId}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage.content}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Usuário #{selectedConversation.otherUserId}</p>
                      <p className="text-sm text-muted-foreground">Veículo #{selectedConversation.carId}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages && messages.length > 0 ? (
                      messages.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.senderId === user.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">Nenhuma mensagem ainda</p>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Selecione uma conversa</p>
                  <p className="text-sm text-muted-foreground">
                    Escolha uma conversa da lista para começar a conversar
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
