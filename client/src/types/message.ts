export interface MessageSender {
  _id: string;
  name: string;
  username: string;
}

export interface Message {
  _id: string;
  user: MessageSender;
  text: string;
  createdAt: string;
  updatedAt: string;
}