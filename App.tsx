import {
  StyleSheet,
  Text,
  View,
  Pressable,
  PermissionsAndroid,
  NativeEventEmitter, NativeModules, FlatList, TouchableOpacity
} from 'react-native';
import React, { useEffect, useState } from 'react';
import BleManager from 'react-native-ble-manager';
import { colors } from './colors';
const App = () => {

  const [bluetoothDevices, setBluetoothDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  //bluetooth value
  const BleManagerModule = NativeModules.BleManager;
  //bluetoth notfication listner
  const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);
  const [currentDevice, setCurrentDevice] = useState(null)
  useEffect(() => {
    BleManager.start({ showAlert: false }).then(() => {
      // Success code
      console.log('Module initialized');
    });
    AndroidPremission();
    handleGetConnectedDevices();
  }, []);


  useEffect(() => {


    let stopListener = BleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        setIsScanning(false);
        console.log('Scan is stopped');
        handleGetConnectedDevices();
      },
    );

    let disconnected = BleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      peripheral => {
        console.log('Disconnected Device', peripheral);
      },
    );

    return () => {
      stopListener.remove();
      disconnected.remove();

    };
  }, []);


  const handleGetConnectedDevices = () => {

    BleManager.getDiscoveredPeripherals().then((results: any) => {

      console.log('result', results);
      if (results.length == 0) {
        console.log('No connected bluetooth devices');
        startScanning();
      } else {
        const allDevices = results.filter((item: any) => item.name !== null);

        setBluetoothDevices(results);

      }
    });
  };


  //onconnect
  const onConnect = async (item: any, index: number) => {
    console.log("CONNECTED DEVICE:::", item)
    try {
      await BleManager.connect(item.id);
      console.log('Connected');
      setCurrentDevice(item);

      const res = await BleManager.retrieveServices(item.id);
      console.log("RES::::", JSON.stringify(res));
    } catch (error) {
      // Failure code
      console.error(error);
    }
  };
  //disconnect
  const onDisconnect = () => {
    BleManager.disconnect(currentDevice?.id).then(() => {
      setCurrentDevice(null);

    })
  }


  const AndroidPremission = () => {
    BleManager.enableBluetooth()
      .then(() => {
        // Success code
        console.log('The bluetooth is already enabled or the user confirm');
        requestPremissionAndroid();
      })
      .catch(error => {
        // Failure code
        console.log('The user refuse to enable bluetooth', error);
      });
  };

  const requestPremissionAndroid = async () => {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    // if (granted) {
    //   startScanning();
    // }
  };


  //Scanning Start 
  const startScanning = () => {
    if (!isScanning) {
      BleManager.scan([], 10, true)
        .then(() => {
          console.log('Scan is started.....');

          setIsScanning(true);
        })
        .catch(error => {
          console.error(error);
        });
    }
  };


  //list bluetooth device 
  const renderItem = ({ item, index }: any) => {
    console.log("BLE ITEM:::", JSON.stringify(item))
    return (
      <View>
        <View style={styles.bleCard}>
          <Text style={styles.nameTxt}>{item.name}</Text>
          <TouchableOpacity onPress={() => item.id === currentDevice?.id ? onDisconnect() : onConnect(item, index)} style={styles.button}>
            <Text style={styles.btnTxt}>{item.id === currentDevice?.id ? "Disconnect" : "Connect"}</Text>
          </TouchableOpacity>
        </View>


      </View>

    )
  }



  return (
    <View style={styles.contanir}>
      {/* <Pressable
        onPress={() => {
          console.log('ssss');
        }}>
        <Text>App</Text>
      </Pressable> */}


      {isScanning ? <View style={{
        flex: 1, justifyContent: "center",
        alignItems: "center"
      }}>

        <Text style={styles.btnTxt}>Scanning..</Text>
      </View> :

        <FlatList data={bluetoothDevices}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
      }


      <TouchableOpacity onPress={() =>


        //startScanning()
        console.log('data', bluetoothDevices)


      } style={styles.scanBtn}>
        <Text style={styles.btnTxt}>Start Scan</Text>
      </TouchableOpacity>
    </View >
  );
};

export default App;

const styles = StyleSheet.create({
  contanir: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bleCard: {
    width: "90%",
    padding: 10,
    alignSelf: "center",
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.secondary,
    elevation: 5,
    borderRadius: 5
  },
  nameTxt: {
    fontSize: 18,
    color: colors.text
  },
  button: {
    width: 100,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 5
  },
  btnTxt: {
    fontSize: 19,
    color: colors.secondary
  },
  label: {
    fontSize: 20,
    textAlign: 'center',
    color: colors.text,
  },

  tempCard: {
    width: "90%",
    backgroundColor: colors.secondary,
    elevation: 2,
    paddingVertical: 5,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  fullRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 5,
    alignSelf: "center"
  },
  scanBtn: {
    width: "90%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: 5
  }
});
