import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Heart } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const dotsAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de fade in
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animação de pulsação do coração
    const createPulseAnimation = () => {
      return Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);
    };

    // Animação dos pontinhos de carregamento
    const createDotsAnimation = () => {
      return Animated.sequence([
        Animated.timing(dotsAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]);
    };

    // Loop das animações
    const pulseLoop = Animated.loop(createPulseAnimation(), {
      iterations: -1,
    });
    
    const dotsLoop = Animated.loop(createDotsAnimation(), {
      iterations: -1,
    });
    
    pulseLoop.start();
    dotsLoop.start();

    // Finalizar splash screen após 3 segundos
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
      dotsLoop.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Background com gradiente simulado */}
      <View style={styles.gradientBackground} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnimation,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Heart size={40} color="#fff" fill="#fff" />
          </View>
        </Animated.View>

        <Text style={styles.appName}>GlicoInfo</Text>
        <Text style={styles.tagline}>Seu cuidado com diabetes</Text>
        
        {/* Indicador de carregamento */}
        <View style={styles.loadingContainer}>
          <Animated.View 
            style={[
              styles.loadingDots,
              {
                opacity: dotsAnimation,
              }
            ]}
          >
            <View style={[styles.dot]} />
            <View style={[styles.dot, { opacity: 0.7 }]} />
            <View style={[styles.dot, { opacity: 0.4 }]} />
          </Animated.View>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563eb', // Azul mais vibrante
    // Simulando gradiente com shadow/overlay
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: height },
    shadowOpacity: 0.3,
    shadowRadius: height / 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 60,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});