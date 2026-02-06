import React,{use, useEffect,useState,useRef} from "react";
import { 
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert,
    ScrollView,} from "react-native";
import Toast from "react-native-toast-message";
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { authAPI,ChatAPI,} from "../services/api";
import { Button, TextInput } from "react-native";
function ChatScreen() {
    const [chats,setChats] = useState("");
    const [inputText, setInputText] = useState("");
    const [lastChats,setLastChats] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading,setLoading] = useState(false);
    /*useEffect(()=>{
        const chatt = "page under construction";
        setChats(chatt);
        Toast.show({
            type:"info",
            text1:"Info",
            text2:"Chat feature is under construction",
        });
        setLoading(false);
    },[]);*/
    // Do not auto-send on mount; wait for user input
    const handleSend = () => {
        if (!inputText || inputText.trim() === "") {
            Toast.show({ type: "error", text1: "Empty message", text2: "Please type a message before sending." });
            return;
        }
        localStorage.setItem("chats",inputText);
        setLoading(true);
        fetchChats();
        loadSavedChats();
        setRefreshing(false);
    };
    const fetchChats = async () => {
        try {
            const userData = await authAPI.getCurrentUser();
            if (userData) {
                const response = await ChatAPI.chatWithAssistant(userData.user_id, inputText);   
                setChats(response.response);
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: "Chat response received",
                });
            } else {
                setChats("User not logged in.");
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
            setChats("Failed to load chat data.");
        } finally {
            setLoading(false);
        }
    };
    const intervalRef = useRef(null);
    useEffect(()=>{
        const loadSavedChats = async () => {
            try{
                const userData = await authAPI.getCurrentUser();
                if(userData){
                    const savedChats = await ChatAPI.getChatHistory(userData.user_id);
                    setLastChats(savedChats.chat_history ||[]);
                }else{
                    setLastChats("User not logged in.");
                }
            }
            catch(error){
                console.error("Error loading saved chats:",error);
            }
        };
        loadSavedChats();
        if (!intervalRef.current){
            intervalRef.current = setInterval(loadSavedChats,180000);
            return ()=> {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            };
        }
    },[])
    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };
    return(
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.contained}>
                budget assistant
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <>
                        <View style={styles.content}>
                            <Text style={styles.title}>Budget Assistant</Text>
                            {Array.isArray(lastChats) && lastChats.length > 0 ? (
                                <ScrollView style={styles.chatsList}>
                                    {lastChats.map((item, idx) => (
                                        <View key={idx} style={styles.chatBox}>
                                            <Text style={styles.chatText}>You: {item.user_message}</Text>
                                            <Text style={[styles.chatText, { textAlign: 'left', marginTop: 10 }]}>Assistant: {item.assistant_response}</Text>
                                            <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>{item.timestamp}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            ) : (
                                <MaterialIcons name="bubble-chart" size={24} color="#000" />
                            )}
                        <TouchableOpacity>
                                { chats ? (
                                    <ScrollView style={styles.replyBox}>
                                        <Text style={styles.ai_text}>{chats}</Text>
                                    </ScrollView>
                                ) : (
                                    <>
                                        <Text style={{ fontSize: 16, color: '#888' }}>Ask me anything about your budget!</Text>
                                        <MaterialCommunityIcons name="chat-processing-outline" size={100} color="#000" />
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity>
                                {inputText ? (
                                    <ScrollView style={styles.chatBox}>
                                        <Text style={styles.chatText}>You: {inputText}</Text>
                                    </ScrollView>
                                ) : (
                                    <MaterialIcons name="bubble-chart" size={24} color="#000"></MaterialIcons>
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={{alignItems:'center',marginTop:10}}>
                            <TextInput
                                style={styles.input}
                                placeholder="how much do i have left"
                                keyboardType="default"
                                value={inputText}
                                onChangeText={setInputText}
                            />
                            <TouchableOpacity
                                style={styles.Button}
                                onPress={handleSend}
                            >
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </ScrollView>
    )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contained:{
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: 30,
    fontSize:20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#000',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    marginTop:'100%',
    borderColor: '#E0E0E0',
  },
  replyBox: {
    marginTop:20,
    padding:15,
    fontWeight:'bold',
    backgroundColor:'#e0e0e0',
    borderRadius:10,
  },
    chatsList: {
        width: '100%',
        maxHeight:'auto',
    },
  chatBox:{
    marginTop:20,
    padding:15,
    backgroundColor:'#1a548eff',
    borderRadius:10,
  },
  ai_text:{
    fontSize:16,
    fontWeight:'bold',
    textAlign:'left',
    color:'#0b0a0aff',
  },
  chatText:{
    fontSize:16,
    fontWeight:'bold',
    textAlign:'right',
    color:'#fff',
  },
  Button: {
    backgroundColor: '#21be30ff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
});
export default ChatScreen;