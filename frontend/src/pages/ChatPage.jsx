import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from 'react-hot-toast';
import { Check, CheckCheck } from 'lucide-react';
import './chat.css';

const ChatPage = ({ recipientId, onClose }) => {
    const [message, setMessage] = useState("");
    const [image, setImage] = useState(null);
    const queryClient = useQueryClient();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const { data: messages, isLoading, error } = useQuery({
        queryKey: ["chatHistory", recipientId],
        queryFn: () => axiosInstance.get(`/chat/${recipientId}`),
        enabled: !!recipientId,
        onSuccess: (data) => {
            console.log("Chat history fetched successfully", data);
        },
        onError: (err) => {
            console.log("Chat history fetched not-successfully", data);
            toast.error(err.response?.data.message || "Failed to fetch chat history");
        },
    });

    const mutation = useMutation({
        mutationFn: (formData) => {
            
            return axiosInstance.post("/chat/send", formData);
        },
        onSuccess: (data) => {
            toast.success("Message sent successfully");
            queryClient.invalidateQueries(["chatHistory", recipientId]);
            setMessage("");
            setImage(null);
        },
        onError: (err) => {
            toast.error(err.response?.data.message || "Failed to send message");
        },
    });

    const handleSendMessage = () => {
        const formData = new FormData();
        formData.append('content',message.trim());
        formData.append('image',image);
        formData.append("recipientId",recipientId)
       if (message.trim() || image) {
            mutation.mutate(formData);
        } else {
            toast.error("Please enter a message or select an image");
        }
    };

    const handleImageUpload = (event) => {
        setImage(event.target.files[0]);
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const renderDeliveryStatus = (status) => {
        switch (status) {
            case 'sent':
                return <Check size={16} />;
            case 'delivered':
                return <CheckCheck size={16} />;
            case 'seen':
                return <CheckCheck size={16} color="blue" />;
            default:
                return null;
        }
    };

    return (
        <div className="chatbox">
            <div className="chat-header">
                <button onClick={onClose}>Close Chat</button>
            </div>
            <div className="chat-messages">
                {isLoading ? (
                    <p>Loading messages...</p>
                ) : error ? (
                    <p>Error loading messages: {error.message}</p>
                ) : messages && messages.data ? (
                    messages.data.map((msg) => (
                        <div key={msg._id} className={`message ${msg.sender === recipientId ? 'received' : 'sent'}`}>
                            {msg.image && <img src={msg.image} alt="Sent image" className="message-image" />}
                            {msg.content && <span className="content">{msg.content}</span>}
                            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            {msg.sender !== recipientId && (
                                <span className="delivery-status">
                                    {renderDeliveryStatus(msg.deliveryStatus)}
                                </span>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No messages yet.</p>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message"
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                    accept="image/*"
                />
                <button onClick={() => fileInputRef.current.click()}>
                    {image ? 'Image selected' : 'Add Image'}
                </button>
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default ChatPage;