import type { CreateNpcProfileCommand, GenerateNpcProfileCommand } from '../../types';
import { generateNpcProfileSchema } from '../schemas/npc-profile.schema';

/**
 * Mock AI Service for development purposes
 * This service returns pre-defined mock responses instead of calling external APIs
 */
export class MockAIService {
  /**
   * Generates a mock NPC profile preview
   * @param command The generation command containing initial prompt and settings
   * @returns A preview of the generated NPC profile in CreateNpcProfileCommand format
   */
  async generateNpcProfile(command: GenerateNpcProfileCommand): Promise<CreateNpcProfileCommand> {
    // Validate the command
    const validatedCommand = generateNpcProfileSchema.parse(command);

    try {
      // Mock response based on complexity level
      const mockProfile: CreateNpcProfileCommand = {
        name: "Geralt z Rivii",
        appearance: validatedCommand.complexity_level === "szczegółowy" 
          ? "Białowłosy mężczyzna o kocich oczach, z blizną na twarzy. Nosi czarną skórzaną zbroję i dwa miecze na plecach."
          : "Białowłosy mężczyzna w czarnej zbroi.",
        profession: "Wiedźmin",
        relationship_to_party: "Neutralny najemnik, potencjalny sojusznik jeśli zapłata jest odpowiednia",
        scene_description: validatedCommand.complexity_level === "uproszczony"
          ? "Siedzi samotnie w kącie karczmy"
          : "Siedzi samotnie w kącie karczmy, popijając piwo i obserwując uważnie innych gości. Jego miecze leżą w zasięgu ręki, a przy pasie widać sakiewkę z klejnotami - zapewne zapłatę za ostatnie zlecenie.",
        special_traits: validatedCommand.complexity_level === "szczegółowy"
          ? "Mutant o nadludzkich zdolnościach, biegły w alchemii i magicznych znakach. Znany z sarkastycznego poczucia humoru i skomplikowanego kodeksu moralnego."
          : "Mutant o nadludzkich zdolnościach",
        complexity_level: validatedCommand.complexity_level,
        is_public: false
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return mockProfile;
    } catch (error) {
      // Log the error for monitoring
      console.error('Mock AI service error:', error);
      throw new Error('Failed to generate mock NPC profile');
    }
  }

  /**
   * Mock implementation of sendChat
   * @param message The user message
   * @returns A mock chat response
   */
  async sendChat(message: string): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      message: `Mock response to: ${message}`,
      confidence: 0.95
    };
  }
} 